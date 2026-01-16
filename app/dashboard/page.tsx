import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import DashboardContent from "@/components/DashboardContent";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
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
      _count: { select: { attendees: true } },
    },
  });

  const totalRegistered = await prisma.attendee.count({
    where: { event: { ownerId: user.id } },
  });

  const eventSummaries = events.map((event) => ({
    id: event.id,
    name: event.name,
    startAt: event.startAt ? event.startAt.toISOString() : null,
    endAt: event.endAt ? event.endAt.toISOString() : null,
    location: event.location,
    attendeeCount: event._count.attendees,
  }));

  return (
    <DashboardShell userEmail={user.email} current="overview" eventId={null}>
      <DashboardContent
        userEmail={user.email}
        events={eventSummaries}
        totalRegistered={totalRegistered}
      />
    </DashboardShell>
  );
}
