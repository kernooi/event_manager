import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import EventBreadcrumbs from "@/components/EventBreadcrumbs";

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
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

function getStatusStyles(status: string) {
  switch (status) {
    case "Upcoming":
      return "bg-[#fdf3e8] text-[#9a5a2c]";
    case "Ongoing":
      return "bg-[#e9f3ef] text-[#2f6d4f]";
    case "Past":
      return "bg-[#f2f1ef] text-[#6b5a4a]";
    default:
      return "bg-[#f1e7dc] text-[#7a5b48]";
  }
}

function getStatusDetail(startAt: Date | null, endAt: Date | null, now: Date) {
  if (!startAt || !endAt) {
    return "Add dates to publish the schedule.";
  }

  const dayMs = 1000 * 60 * 60 * 24;

  if (endAt.getTime() < now.getTime()) {
    const diffMs = now.getTime() - endAt.getTime();
    if (diffMs < dayMs) {
      return "Event wrapped up today.";
    }

    const daysAgo = Math.ceil(diffMs / dayMs);
    return daysAgo === 1
      ? "Event wrapped up yesterday."
      : `Event wrapped up ${daysAgo} days ago.`;
  }

  if (startAt.getTime() > now.getTime()) {
    const diffMs = startAt.getTime() - now.getTime();
    if (diffMs < dayMs) {
      return "Starts today.";
    }

    const daysUntil = Math.ceil(diffMs / dayMs);
    return daysUntil === 1 ? "Starts tomorrow." : `Starts in ${daysUntil} days.`;
  }

  return "Live now. Check in arrivals.";
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

  const [
    inviteCount,
    usedInviteCount,
    checkedInCount,
    registrationFieldCount,
    recentAttendees,
  ] = await prisma.$transaction([
    prisma.invite.count({ where: { eventId: event.id } }),
    prisma.invite.count({ where: { eventId: event.id, usedAt: { not: null } } }),
    prisma.attendee.count({
      where: { eventId: event.id, checkedInAt: { not: null } },
    }),
    prisma.registrationField.count({ where: { eventId: event.id } }),
    prisma.attendee.findMany({
      where: { eventId: event.id },
      orderBy: { registeredAt: "desc" },
      take: 4,
      select: {
        id: true,
        fullName: true,
        email: true,
        registeredAt: true,
      },
    }),
  ]);

  const now = new Date();
  const status = getStatus(event.startAt, event.endAt, now);
  const statusStyles = getStatusStyles(status);
  const statusDetail = getStatusDetail(event.startAt, event.endAt, now);
  const invitePendingCount = Math.max(inviteCount - usedInviteCount, 0);
  const notCheckedInCount = Math.max(
    event._count.attendees - checkedInCount,
    0
  );

  return (
    <DashboardShell userEmail={user.email} current="overview" eventId={event.id}>
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <EventBreadcrumbs
                eventId={event.id}
                eventName={event.name}
                current="Overview"
              />
              <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
                {event.name}
              </h1>
              <p className="mt-2 text-sm text-[#6b5a4a]">
                {formatDateRange(event.startAt, event.endAt)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                {event.location ? event.location : "Location TBD"}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles}`}
            >
              {status}
            </span>
          </div>
          <p className="mt-4 text-sm text-[#6b5a4a]">{statusDetail}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Registered
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {event._count.attendees}
            </p>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              {checkedInCount} checked in
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Invites Sent
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {inviteCount}
            </p>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              {usedInviteCount} claimed
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Check-ins
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {checkedInCount}
            </p>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              {notCheckedInCount} remaining
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Custom Questions
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {registrationFieldCount}
            </p>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              Added to the form.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                  Recent registrations
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
                  Latest guests
                </h2>
              </div>
              <Link
                href={`/dashboard/events/${event.id}/attendees`}
                className="rounded-full border border-[#1b1a18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
              >
                View all
              </Link>
            </div>
            <div className="mt-5 space-y-3 text-sm text-[#5b4a3d]">
              {recentAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-[#1b1a18]">
                      {attendee.fullName}
                    </p>
                    <p className="text-xs text-[#6b5a4a]">
                      {attendee.email || "Email not provided"}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                    {formatDate(attendee.registeredAt)}
                  </p>
                </div>
              ))}
              {recentAttendees.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d9c9b9] p-4 text-sm text-[#6b5a4a]">
                  <p>
                    No registrations yet. Share the invite link to collect guest
                    details.
                  </p>
                  <Link
                    href={`/dashboard/events/${event.id}/invites`}
                    className="mt-3 inline-flex items-center rounded-full border border-[#1b1a18] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
                  >
                    Send invites
                  </Link>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Operations
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
              Keep the event on track
            </h2>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              Review the key flows before doors open.
            </p>
            <div className="mt-5 space-y-3 text-sm text-[#5b4a3d]">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] px-4 py-3">
                <div>
                  <p className="font-semibold text-[#1b1a18]">
                    Registration form
                  </p>
                  <p className="text-xs text-[#6b5a4a]">
                    {registrationFieldCount} custom questions
                  </p>
                </div>
                <Link
                  href={`/dashboard/events/${event.id}/registration`}
                  className="rounded-full border border-[#1b1a18] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
                >
                  Edit
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] px-4 py-3">
                <div>
                  <p className="font-semibold text-[#1b1a18]">Invites</p>
                  <p className="text-xs text-[#6b5a4a]">
                    {invitePendingCount} pending, {usedInviteCount} claimed
                  </p>
                </div>
                <Link
                  href={`/dashboard/events/${event.id}/invites`}
                  className="rounded-full border border-[#1b1a18] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
                >
                  Manage
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] px-4 py-3">
                <div>
                  <p className="font-semibold text-[#1b1a18]">Check-in</p>
                  <p className="text-xs text-[#6b5a4a]">
                    {checkedInCount} checked in
                  </p>
                </div>
                <Link
                  href={`/dashboard/events/${event.id}/checkin`}
                  className="rounded-full border border-[#1b1a18] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
                >
                  Open
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
