import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

type AttendeesPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ status?: string | string[] }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatDietary(value: string) {
  if (!value || value === "NONE") {
    return "No restrictions";
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatGender(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAnswerValue(value: unknown) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items.join(", ") : "Not provided";
  }

  if (value === null || value === undefined) {
    return "Not provided";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const text = String(value).trim();
  return text ? text : "Not provided";
}

export default async function AttendeesPage({
  params,
  searchParams,
}: AttendeesPageProps) {
  const { eventId } = await params;
  const query = searchParams ? await searchParams : {};
  const rawStatus = query.status;
  const statusValue = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const status =
    statusValue === "checked-in" || statusValue === "not-checked-in"
      ? statusValue
      : "all";
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
    select: { id: true, name: true },
  });

  if (!event) {
    redirect("/dashboard");
  }

  const attendeeFilter =
    status === "checked-in"
      ? { checkedInAt: { not: null } }
      : status === "not-checked-in"
        ? { checkedInAt: null }
        : {};

  const [totalCount, checkedInCount, attendees] = await prisma.$transaction([
    prisma.attendee.count({ where: { eventId: event.id } }),
    prisma.attendee.count({
      where: { eventId: event.id, checkedInAt: { not: null } },
    }),
    prisma.attendee.findMany({
      where: { eventId: event.id, ...attendeeFilter },
      orderBy: { registeredAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        age: true,
        gender: true,
        dietary: true,
        table: true,
        registeredAt: true,
        checkedInAt: true,
        answers: {
          orderBy: { field: { order: "asc" } },
          select: {
            id: true,
            value: true,
            field: { select: { label: true, type: true, order: true } },
          },
        },
      },
    }),
  ]);
  const notCheckedInCount = totalCount - checkedInCount;
  const basePath = `/dashboard/events/${event.id}/attendees`;
  const statusFilters = [
    { key: "all", label: "All", count: totalCount },
    { key: "checked-in", label: "Checked in", count: checkedInCount },
    { key: "not-checked-in", label: "Not checked in", count: notCheckedInCount },
  ] as const;

  return (
    <DashboardShell userEmail={user.email} current="attendees" eventId={event.id}>
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                Attendees
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
                {event.name}
              </h1>
              <p className="mt-2 text-sm text-[#6b5a4a]">
                Review who registered and track check-ins in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const isActive = status === filter.key;
                const href =
                  filter.key === "all"
                    ? basePath
                    : `${basePath}?status=${filter.key}`;

                return (
                  <Link
                    key={filter.key}
                    href={href}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      isActive
                        ? "border-[#1b1a18] bg-[#1b1a18] text-[#f4efe4]"
                        : "border-[#d9c9b9] text-[#5b4a3d] hover:bg-[#fbf8f2]"
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Registered
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {totalCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Checked in
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {checkedInCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d6c8] bg-white p-5 shadow-[0_20px_45px_-35px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
              Awaiting check-in
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1b1a18]">
              {notCheckedInCount}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                Attendee List
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
                {attendees.length} showing
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {attendees.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#d9c9b9] p-4 text-sm text-[#6b5a4a]">
                {totalCount === 0
                  ? "No attendees yet. Share invites to start registrations."
                  : "No attendees match this filter yet."}
              </p>
            ) : (
              attendees.map((attendee) => {
                const isCheckedIn = Boolean(attendee.checkedInAt);
                const statusStyles = isCheckedIn
                  ? "bg-[#e9f3ef] text-[#2f6d4f]"
                  : "bg-[#f2f1ef] text-[#6b5a4a]";
                const contact = [attendee.email, attendee.phone]
                  .filter(Boolean)
                  .join(" | ");

                return (
                  <details
                    key={attendee.id}
                    className="group rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] text-sm text-[#5b4a3d]"
                  >
                    <summary className="cursor-pointer list-none px-4 py-4 [&::-webkit-details-marker]:hidden">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#1b1a18]">
                            {attendee.fullName}
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                            Registered {formatDate(attendee.registeredAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-xs">
                          <span
                            className={`rounded-full px-3 py-1 font-semibold uppercase tracking-[0.2em] ${statusStyles}`}
                          >
                            {isCheckedIn ? "Checked in" : "Not checked in"}
                          </span>
                          <span className="text-[#6b5a4a]">
                            {attendee.checkedInAt
                              ? `Checked ${formatDateTime(attendee.checkedInAt)}`
                              : "No scan yet"}
                          </span>
                        </div>
                      </div>
                    </summary>

                    <div className="border-t border-[#f0e4d8] px-4 pb-4">
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-[1.2fr_0.8fr]">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                            Contact
                          </p>
                          <p className="mt-1 text-[#5b4a3d]">
                            {contact || "No contact details"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                            Details
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#d9c9b9] px-3 py-1 text-xs text-[#3f352c]">
                              Age {attendee.age ?? "Not provided"}
                            </span>
                            <span className="rounded-full border border-[#d9c9b9] px-3 py-1 text-xs text-[#3f352c]">
                              {formatGender(attendee.gender)}
                            </span>
                            <span className="rounded-full border border-[#d9c9b9] px-3 py-1 text-xs text-[#3f352c]">
                              {formatDietary(attendee.dietary)}
                            </span>
                            {attendee.table ? (
                              <span className="rounded-full border border-[#d9c9b9] px-3 py-1 text-xs text-[#3f352c]">
                                Table {attendee.table}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                          Additional Answers
                        </p>
                        {attendee.answers.length === 0 ? (
                          <p className="mt-2 text-sm text-[#6b5a4a]">
                            No additional answers submitted.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {attendee.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#eadbce] bg-white px-3 py-2 text-sm"
                              >
                                <span className="font-medium text-[#1b1a18]">
                                  {answer.field.label}
                                </span>
                                <span className="text-[#5b4a3d]">
                                  {formatAnswerValue(answer.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                );
              })
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

