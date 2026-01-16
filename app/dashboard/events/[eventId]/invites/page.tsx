import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import InviteSender from "@/components/InviteSender";

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
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Invites
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
            Send private registration links and track invite status.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                  Invite List
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
                  {invites.length} sent
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {invites.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d9c9b9] p-4 text-sm text-[#6b5a4a]">
                  No invites yet. Send the first invite from the panel on the
                  right.
                </p>
              ) : (
                invites.map((invite) => {
                  const statusStyles =
                    invite.status === "USED"
                      ? "bg-[#e9f3ef] text-[#2f6d4f]"
                      : invite.status === "SENT"
                        ? "bg-[#fdf3e8] text-[#9a5a2c]"
                        : "bg-[#f2f1ef] text-[#6b5a4a]";

                  return (
                    <div
                      key={invite.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] px-4 py-3 text-sm text-[#5b4a3d]"
                    >
                      <div>
                        <p className="font-semibold text-[#1b1a18]">
                          {invite.email ?? "Unknown email"}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                          Sent {formatDate(invite.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {invite.usedAt ? (
                          <span className="text-xs text-[#6b5a4a]">
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

          <InviteSender eventId={event.id} />
        </div>
      </div>
    </DashboardShell>
  );
}
