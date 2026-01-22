import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import CheckInScanner from "@/components/CheckInScanner";
import EventBreadcrumbs from "@/components/EventBreadcrumbs";

type CheckInPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
    select: { id: true, name: true, startAt: true },
  });

  if (!event) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell userEmail={user.email} current="checkin" eventId={event.id}>
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
          <EventBreadcrumbs
            eventId={event.id}
            eventName={event.name}
            current="Check-in"
          />
          <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Scan attendee QR codes to record arrivals.
          </p>
        </section>

        <CheckInScanner
          eventId={event.id}
          startsAt={event.startAt ? event.startAt.toISOString() : null}
        />
      </div>
    </DashboardShell>
  );
}



