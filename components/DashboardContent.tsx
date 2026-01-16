"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CreateEventCard from "@/components/CreateEventCard";
import DeleteEventButton from "@/components/DeleteEventButton";

type EventSummary = {
  id: string;
  name: string;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  attendeeCount: number;
};

type DashboardContentProps = {
  userEmail: string;
  events: EventSummary[];
  totalRegistered: number;
};

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

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

function sortEvents(events: EventSummary[]) {
  return [...events].sort((a, b) => {
    const aTime = a.startAt ? new Date(a.startAt).getTime() : Number.MAX_VALUE;
    const bTime = b.startAt ? new Date(b.startAt).getTime() : Number.MAX_VALUE;
    return aTime - bTime;
  });
}

export default function DashboardContent({
  userEmail,
  events,
  totalRegistered,
}: DashboardContentProps) {
  const [eventList, setEventList] = useState<EventSummary[]>(events);
  const [registeredTotal, setRegisteredTotal] = useState(totalRegistered);

  const sortedEvents = useMemo(() => sortEvents(eventList), [eventList]);
  const now = new Date();
  const upcomingEvent = sortedEvents.find((event) => {
    const startAt = toDate(event.startAt);
    return startAt && startAt.getTime() > now.getTime();
  });

  function handleCreated(event: {
    id: string;
    name: string;
    startAt: string | null;
    endAt: string | null;
    location: string | null;
  }) {
    setEventList((prev) =>
      sortEvents([
        ...prev,
        {
          id: event.id,
          name: event.name,
          startAt: event.startAt,
          endAt: event.endAt,
          location: event.location,
          attendeeCount: 0,
        },
      ])
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Overview
            </p>
            <h1 className="text-2xl font-semibold text-[#1b1a18]">
              Welcome back, {userEmail}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[#6b5a4a]">
            <span className="rounded-full border border-[#d9c9b9] px-4 py-2">
              Total events: {sortedEvents.length}
            </span>
            <span className="rounded-full border border-[#d9c9b9] px-4 py-2">
              Total registered: {registeredTotal}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Total Events
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {sortedEvents.length}
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
              {registeredTotal}
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
              {upcomingEvent ? upcomingEvent.name : "No upcoming events"}
            </p>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              {upcomingEvent
                ? formatDateRange(
                    toDate(upcomingEvent.startAt),
                    toDate(upcomingEvent.endAt)
                  )
                : "Schedule the next experience."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <CreateEventCard onCreated={handleCreated} />
        <div className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Status Overview
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#1b1a18]">
            Event pipeline at a glance
          </h3>
          <div className="mt-6 space-y-4 text-sm text-[#5b4a3d]">
            {sortedEvents.slice(0, 4).map((event) => {
              const status = getStatus(
                toDate(event.startAt),
                toDate(event.endAt),
                now
              );
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
                    {formatDateRange(
                      toDate(event.startAt),
                      toDate(event.endAt)
                    )}
                  </p>
                </div>
              );
            })}
            {sortedEvents.length === 0 ? (
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
            {sortedEvents.length} total events
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {sortedEvents.map((event) => {
            const status = getStatus(
              toDate(event.startAt),
              toDate(event.endAt),
              now
            );
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
                      {formatDateRange(
                        toDate(event.startAt),
                        toDate(event.endAt)
                      )}
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
                    Registered: {event.attendeeCount}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/events/${event.id}/overview`}
                      className="rounded-full border border-[#1b1a18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
                    >
                      View Event
                    </Link>
                    <DeleteEventButton
                      eventId={event.id}
                      onDeleted={() => {
                        setEventList((prev) =>
                          prev.filter((item) => item.id !== event.id)
                        );
                        setRegisteredTotal((prev) =>
                          Math.max(0, prev - event.attendeeCount)
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {sortedEvents.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-[#d9c9b9] bg-[#fbf8f2] p-6 text-sm text-[#6b5a4a]">
            No events yet. Create your first event to start collecting
            registrations.
          </div>
        ) : null}
      </section>
    </div>
  );
}
