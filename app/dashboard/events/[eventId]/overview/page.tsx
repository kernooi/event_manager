import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

type EventOverviewPageProps = {
  params: Promise<{ eventId: string }>;
};

function formatDateRange(startAt: Date | null, endAt: Date | null) {
  if (!startAt || !endAt) {
    return "Dates TBD";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formatter.format(startAt)} - ${formatter.format(endAt)}`;
}

export default async function EventOverviewPage({
  params,
}: EventOverviewPageProps) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
    select: {
      id: true,
      name: true,
      startAt: true,
      endAt: true,
      location: true,
      _count: { select: { attendees: true } },
    },
  });

  if (!event) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell userEmail={user.email} current="overview" eventId={event.id}>
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Event Overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
            {formatDateRange(event.startAt, event.endAt)}
          </p>
          {event.location ? (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              {event.location}
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Registered
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {event._count.attendees}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Registration
            </p>
            <p className="mt-3 text-lg font-semibold text-[#1b1a18]">
              Ready to customize
            </p>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              Edit the registration form to collect extra details.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Invites
            </p>
            <p className="mt-3 text-lg font-semibold text-[#1b1a18]">
              Coming soon
            </p>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              Invite flows will appear here.
            </p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
