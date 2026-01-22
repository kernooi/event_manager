import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import InviteSender from "@/components/InviteSender";
import EventBreadcrumbs from "@/components/EventBreadcrumbs";

type InvitesPageProps = {
  params: Promise<{ eventId: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function InvitesPage({ params }: InvitesPageProps) {
  const { eventId } = await params;
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

  const invites = await prisma.invite.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      usedAt: true,
    },
  });

  return (
    <DashboardShell userEmail={user.email} current="invites" eventId={event.id}>
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
          <EventBreadcrumbs
            eventId={event.id}
            eventName={event.name}
            current="Invites"
          />
          <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Send private registration links and track invite status.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
                  Invite List
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#0f172a]">
                  {invites.length} sent
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {invites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d6dbe7] p-4 text-sm text-[#64748b]">
                  <p>No invites yet. Send the first invite to start RSVPs.</p>
                  <Link
                    href="#send-invite"
                    className="mt-3 inline-flex items-center rounded-full border border-[#0f172a] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f172a] transition hover:bg-[#0f172a] hover:text-[#f5f7fb]"
                  >
                    Send first invite
                  </Link>
                </div>
              ) : (
                invites.map((invite) => {
                  const statusStyles =
                    invite.status === "USED"
                      ? "bg-[#ecfdf3] text-[#166534]"
                      : invite.status === "SENT"
                        ? "bg-[#fef3c7] text-[#92400e]"
                        : "bg-[#f1f5f9] text-[#64748b]";

                  return (
                    <div
                      key={invite.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]"
                    >
                      <div>
                        <p className="font-semibold text-[#0f172a]">
                          {invite.email ?? "Unknown email"}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                          Sent {formatDate(invite.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {invite.usedAt ? (
                          <span className="text-xs text-[#64748b]">
                            Used {formatDate(invite.usedAt)}
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles}`}
                        >
                          {invite.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <div id="send-invite">
            <InviteSender eventId={event.id} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}



