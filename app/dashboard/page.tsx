import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import CreateEventCard from "@/components/CreateEventCard";
import DeleteEventButton from "@/components/DeleteEventButton";

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

function getStatus(startAt: Date | null, endAt: Date | null, now: Date) {
  if (!startAt || !endAt) {
    return "Draft";
  }

  if (endAt.getTime() < now.getTime()) {
    return "Past";
  }

  if (startAt.getTime() > now.getTime()) {
    return "Upcoming";
  }

  return "Ongoing";
}

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

  const now = new Date();
  const upcomingEvent = events.find(
    (event) => event.startAt && event.startAt.getTime() > now.getTime()
  );

  return (
    <DashboardShell userEmail={user.email} current="overview" eventId={null}>
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-[#d6dbe7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
                Overview
              </p>
              <h1 className="text-2xl font-semibold text-[#0f172a]">
                Welcome back, {user.email}
              </h1>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                Total Events
              </p>
              <p className="mt-3 text-3xl font-semibold text-[#0f172a]">
                {events.length}
              </p>
              <p className="mt-2 text-sm text-[#64748b]">
                Active planning pipelines.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                Total Registered
              </p>
              <p className="mt-3 text-3xl font-semibold text-[#0f172a]">
                {totalRegistered}
              </p>
              <p className="mt-2 text-sm text-[#64748b]">
                Guests across all events.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                Next Upcoming
              </p>
              <p className="mt-3 text-lg font-semibold text-[#0f172a]">
                {upcomingEvent
                  ? upcomingEvent.name
                  : "No upcoming events"}
              </p>
              <p className="mt-2 text-sm text-[#64748b]">
                {upcomingEvent
                  ? formatDateRange(upcomingEvent.startAt, upcomingEvent.endAt)
                  : "Schedule the next experience."}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <CreateEventCard />
          <div className="rounded-3xl border border-[#d6dbe7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
              Status Overview
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[#0f172a]">
              Event pipeline at a glance
            </h3>
            <div className="mt-6 space-y-4 text-sm text-[#64748b]">
              {events.slice(0, 4).map((event) => {
                const status = getStatus(event.startAt, event.endAt, now);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-[#0f172a]">
                        {event.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                        {status}
                      </p>
                    </div>
                    <p className="text-xs text-[#64748b]">
                      {formatDateRange(event.startAt, event.endAt)}
                    </p>
                  </div>
                );
              })}
              {events.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d6dbe7] p-4 text-sm text-[#64748b]">
                  Create your first event to see status insights.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
                Events
              </p>
              <h2 className="text-xl font-semibold text-[#0f172a]">
                Your event lineup
              </h2>
            </div>
            <p className="text-sm text-[#64748b]">
              {events.length} total events
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {events.map((event) => {
              const status = getStatus(event.startAt, event.endAt, now);
              const statusStyles =
                status === "Upcoming"
                  ? "bg-[#fef3c7] text-[#92400e]"
                  : status === "Ongoing"
                    ? "bg-[#ecfdf3] text-[#166534]"
                    : status === "Past"
                      ? "bg-[#f1f5f9] text-[#64748b]"
                      : "bg-[#e2e8f0] text-[#4c5b78]";

              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 rounded-3xl border border-[#d6dbe7] bg-white p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.6)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0f172a]">
                        {event.name}
                      </h3>
                      <p className="text-sm text-[#64748b]">
                        {formatDateRange(event.startAt, event.endAt)}
                      </p>
                      {event.location ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                          {event.location}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#64748b]">
                    <span className="rounded-full border border-[#d6dbe7] px-3 py-2">
                      Registered: {event._count.attendees}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/events/${event.id}/overview`}
                        className="rounded-full border border-[#0f172a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f172a] transition hover:bg-[#0f172a] hover:text-[#f5f7fb]"
                      >
                        View Event
                      </Link>
                      <DeleteEventButton eventId={event.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {events.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-[#d6dbe7] bg-[#f8fafc] p-6 text-sm text-[#64748b]">
              No events yet. Create your first event to start collecting
              registrations.
            </div>
          ) : null}
        </section>
      </div>
    </DashboardShell>
  );
}


