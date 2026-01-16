import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const FIELD_TYPES = ["TEXT", "NUMBER", "DROPDOWN", "CHECKBOX"] as const;

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

  const fields = await prisma.registrationField.findMany({
    where: { eventId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ fields });
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
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let payload: {
    label?: string;
    type?: string;
    required?: boolean;
    options?: string[];
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const label = payload.label?.trim();
  const type = payload.type?.toUpperCase();
  const required = Boolean(payload.required);
  const options = payload.options ?? [];

  if (!label || !type || !FIELD_TYPES.includes(type as typeof FIELD_TYPES[number])) {
    return NextResponse.json(
      { error: "Label and valid field type are required" },
      { status: 400 }
    );
  }

  if ((type === "DROPDOWN" || type === "CHECKBOX") && options.length === 0) {
    return NextResponse.json(
      { error: "Options are required for dropdown and checkbox fields" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.registrationField.aggregate({
    where: { eventId },
    _max: { order: true },
  });

  const field = await prisma.registrationField.create({
    data: {
      eventId,
      label,
      type: type as "TEXT" | "NUMBER" | "DROPDOWN" | "CHECKBOX",
      required,
      options,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ field }, { status: 201 });
}
