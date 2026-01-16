import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(
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
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const invites = await prisma.invite.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      usedAt: true,
    },
  });

  return NextResponse.json({ invites });
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
    select: { id: true, name: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let payload: { email?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const token = crypto.randomUUID();
  const invite = await prisma.invite.create({
    data: {
      eventId,
      token,
      email,
      status: "CREATED",
    },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      usedAt: true,
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const inviteLink = `${appUrl}/invite/${token}`;
  void sendInviteEmail({
    to: email,
    eventName: event.name,
    inviteLink,
  })
    .then(async () => {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "SENT" },
      });
    })
    .catch((error) => {
      console.error("Invite email failed", error);
    });

  return NextResponse.json({ invite }, { status: 201 });
}
