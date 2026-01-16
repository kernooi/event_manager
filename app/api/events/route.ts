import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function parseDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/
  );

  if (match) {
    const [, year, month, day, hour = "0", minute = "0"] = match;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { ownerId: user.id },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      name: true,
      startAt: true,
      endAt: true,
      location: true,
      createdAt: true,
      _count: { select: { attendees: true } },
    },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    name?: string;
    startAt?: string;
    endAt?: string;
    location?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const name = payload.name?.trim();
  const startAt = parseDate(payload.startAt);
  const endAt = parseDate(payload.endAt);
  const location = payload.location?.trim() || null;

  if (!name || !startAt || !endAt) {
    return NextResponse.json(
      { error: "Name, start date, and end date are required" },
      { status: 400 }
    );
  }

  if (endAt.getTime() < startAt.getTime()) {
    return NextResponse.json(
      { error: "End date must be after the start date" },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      ownerId: user.id,
      name,
      startAt,
      endAt,
      location,
    },
    select: {
      id: true,
      name: true,
      startAt: true,
      endAt: true,
      location: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
