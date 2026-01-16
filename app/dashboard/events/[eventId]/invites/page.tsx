import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import InvitesPanel from "@/components/InvitesPanel";

type InvitesPageProps = {
  params: Promise<{ eventId: string }>;
};

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

  const inviteSummaries = invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    status: invite.status,
    createdAt: invite.createdAt.toISOString(),
    usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
  }));

  return (
    <DashboardShell userEmail={user.email} current="invites" eventId={event.id}>
      <InvitesPanel
        eventId={event.id}
        eventName={event.name}
        invites={inviteSummaries}
      />
    </DashboardShell>
  );
}
