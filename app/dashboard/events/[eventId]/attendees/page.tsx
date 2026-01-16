import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

type AttendeesPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function AttendeesPage({ params }: AttendeesPageProps) {
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

  return (
    <DashboardShell userEmail={user.email} current="attendees" eventId={event.id}>
      <div className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
          Attendees
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
          {event.name}
        </h1>
        <p className="mt-2 text-sm text-[#6b5a4a]">
          Attendee lists and exports will be available here.
        </p>
      </div>
    </DashboardShell>
  );
}
