import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrPngBase64 } from "@/lib/qr";
import { sendRegistrationEmail } from "@/lib/email";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeCheckboxValue(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw.map(String).map((value) => value.trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return [raw.trim()];
  }
  return [];
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      event: {
        include: { registrationFields: true },
      },
    },
  });

  if (!invite || invite.status === "USED") {
    return NextResponse.json({ error: "Invite is invalid or used" }, { status: 404 });
  }

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  let payload: {
    fullName?: string;
    email?: string;
    phone?: string;
    answers?: Record<string, string | string[]>;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const phone = payload.phone?.trim();
  const answers = payload.answers ?? {};

  if (!fullName || !email || !phone) {
    return NextResponse.json(
      { error: "Full name, email, and phone are required" },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const validationErrors: string[] = [];
  const answerData: { fieldId: string; value: string | string[] | number }[] =
    [];

  for (const field of invite.event.registrationFields) {
    const rawValue = answers[field.id];

    if (field.type === "CHECKBOX") {
      const values = normalizeCheckboxValue(rawValue);
      if (field.required && values.length === 0) {
        validationErrors.push(`${field.label} is required`);
      }
      if (values.length > 0) {
        answerData.push({ fieldId: field.id, value: values });
      }
      continue;
    }

    const value =
      typeof rawValue === "string" ? rawValue.trim() : rawValue ? String(rawValue) : "";

    if (field.required && !value) {
      validationErrors.push(`${field.label} is required`);
      continue;
    }

    if (!value) {
      continue;
    }

    if (field.type === "NUMBER") {
      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) {
        validationErrors.push(`${field.label} must be a number`);
        continue;
      }
      answerData.push({ fieldId: field.id, value: numberValue });
      continue;
    }

    answerData.push({ fieldId: field.id, value });
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: validationErrors[0] },
      { status: 400 }
    );
  }

  const attendeeToken = crypto.randomUUID();

  const attendee = await prisma.$transaction(async (tx) => {
    const created = await tx.attendee.create({
      data: {
        eventId: invite.eventId,
        inviteId: invite.id,
        token: attendeeToken,
        fullName,
        email,
        phone,
      },
    });

    if (answerData.length > 0) {
      await tx.registrationAnswer.createMany({
        data: answerData.map((answer) => ({
          attendeeId: created.id,
          fieldId: answer.fieldId,
          value: answer.value,
        })),
      });
    }

    await tx.invite.update({
      where: { id: invite.id },
      data: { status: "USED", usedAt: new Date() },
    });

    return created;
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const qrPayload = `${appUrl}/checkin/${attendee.token}`;
  const qrBase64 = await generateQrPngBase64(qrPayload);

  await sendRegistrationEmail({
    to: attendee.email ?? email,
    eventName: invite.event.name,
    qrBase64,
  });

  return NextResponse.json({ ok: true });
}
