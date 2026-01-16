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
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                Overview
              </p>
              <h1 className="text-2xl font-semibold text-[#1b1a18]">
                Welcome back, {user.email}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-[#6b5a4a]">
              <span className="rounded-full border border-[#d9c9b9] px-4 py-2">
                Total events: {events.length}
              </span>
              <span className="rounded-full border border-[#d9c9b9] px-4 py-2">
                Total registered: {totalRegistered}
              </span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                Total Events
              </p>
              <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
                {events.length}
              </p>
              <p className="mt-2 text-sm text-[#6b5a4a]">
                Active planning pipelines.
              </p>
            </div>
            <div className="rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                Total Registered
              </p>
              <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
                {totalRegistered}
              </p>
              <p className="mt-2 text-sm text-[#6b5a4a]">
                Guests across all events.
              </p>
            </div>
            <div className="rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                Next Upcoming
              </p>
              <p className="mt-3 text-lg font-semibold text-[#1b1a18]">
                {upcomingEvent
                  ? upcomingEvent.name
                  : "No upcoming events"}
              </p>
              <p className="mt-2 text-sm text-[#6b5a4a]">
                {upcomingEvent
                  ? formatDateRange(upcomingEvent.startAt, upcomingEvent.endAt)
                  : "Schedule the next experience."}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <CreateEventCard />
          <div className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Status Overview
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[#1b1a18]">
              Event pipeline at a glance
            </h3>
            <div className="mt-6 space-y-4 text-sm text-[#5b4a3d]">
              {events.slice(0, 4).map((event) => {
                const status = getStatus(event.startAt, event.endAt, now);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-[#1b1a18]">
                        {event.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                        {status}
                      </p>
                    </div>
                    <p className="text-xs text-[#6b5a4a]">
                      {formatDateRange(event.startAt, event.endAt)}
                    </p>
                  </div>
                );
              })}
              {events.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d9c9b9] p-4 text-sm text-[#6b5a4a]">
                  Create your first event to see status insights.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                Events
              </p>
              <h2 className="text-xl font-semibold text-[#1b1a18]">
                Your event lineup
              </h2>
            </div>
            <p className="text-sm text-[#6b5a4a]">
              {events.length} total events
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {events.map((event) => {
              const status = getStatus(event.startAt, event.endAt, now);
              const statusStyles =
                status === "Upcoming"
                  ? "bg-[#fdf3e8] text-[#9a5a2c]"
                  : status === "Ongoing"
                    ? "bg-[#e9f3ef] text-[#2f6d4f]"
                    : status === "Past"
                      ? "bg-[#f2f1ef] text-[#6b5a4a]"
                      : "bg-[#f1e7dc] text-[#7a5b48]";

              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1b1a18]">
                        {event.name}
                      </h3>
                      <p className="text-sm text-[#6b5a4a]">
                        {formatDateRange(event.startAt, event.endAt)}
                      </p>
                      {event.location ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
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

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#5b4a3d]">
                    <span className="rounded-full border border-[#d9c9b9] px-3 py-2">
                      Registered: {event._count.attendees}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/events/${event.id}/overview`}
                        className="rounded-full border border-[#1b1a18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
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
            <div className="mt-6 rounded-3xl border border-dashed border-[#d9c9b9] bg-[#fbf8f2] p-6 text-sm text-[#6b5a4a]">
              No events yet. Create your first event to start collecting
              registrations.
            </div>
          ) : null}
        </section>
      </div>
    </DashboardShell>
  );
}
