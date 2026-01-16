import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
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

  await prisma.$transaction([
    prisma.registrationAnswer.deleteMany({
      where: { attendee: { eventId } },
    }),
    prisma.checkIn.deleteMany({ where: { eventId } }),
    prisma.attendee.deleteMany({ where: { eventId } }),
    prisma.invite.deleteMany({ where: { eventId } }),
    prisma.registrationField.deleteMany({ where: { eventId } }),
    prisma.event.delete({ where: { id: eventId } }),
  ]);

  return NextResponse.json({ ok: true });
}
