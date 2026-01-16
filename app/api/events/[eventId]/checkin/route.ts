import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type CheckInPayload = {
  token?: string;
};

function extractToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("/checkin/")) {
    const parts = trimmed.split("/checkin/");
    const tokenPart = parts[1] ?? "";
    return tokenPart.split("?")[0].split("#")[0].trim();
  }

  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split("/");
    const tokenFromPath = pathParts[pathParts.length - 1]?.trim();
    return tokenFromPath || trimmed;
  } catch {
    return trimmed;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await context.params;
  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
    select: { id: true, name: true, startAt: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.startAt && event.startAt.getTime() > Date.now()) {
    return NextResponse.json(
      {
        error: "Check-in opens when the event starts.",
        startsAt: event.startAt.toISOString(),
      },
      { status: 403 }
    );
  }

  let payload: CheckInPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const token = payload.token ? extractToken(payload.token) : "";
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const attendee = await prisma.attendee.findFirst({
    where: { token, eventId: event.id },
    select: { id: true, fullName: true, checkedInAt: true },
  });

  if (!attendee) {
    return NextResponse.json(
      { error: "Attendee not found for this event." },
      { status: 404 }
    );
  }

  if (attendee.checkedInAt) {
    return NextResponse.json({
      status: "already_checked_in",
      attendeeName: attendee.fullName,
      checkedInAt: attendee.checkedInAt.toISOString(),
    });
  }

  const checkedInAt = new Date();
  await prisma.$transaction([
    prisma.checkIn.create({
      data: {
        attendeeId: attendee.id,
        eventId: event.id,
        scannedBy: user.id,
        scannedAt: checkedInAt,
      },
    }),
    prisma.attendee.update({
      where: { id: attendee.id },
      data: { checkedInAt },
    }),
  ]);

  return NextResponse.json({
    status: "checked_in",
    attendeeName: attendee.fullName,
    checkedInAt: checkedInAt.toISOString(),
  });
}
