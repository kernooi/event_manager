import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RegistrationFieldsEditor from "@/components/RegistrationFieldsEditor";
import EventBreadcrumbs from "@/components/EventBreadcrumbs";

type RegistrationPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function RegistrationPage({
  params,
}: RegistrationPageProps) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
    include: { registrationFields: true },
  });

  if (!event) {
    redirect("/dashboard");
  }

  const fields = event.registrationFields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    options: Array.isArray(field.options)
      ? field.options.map(String)
      : null,
  }));

  return (
    <DashboardShell
      userEmail={user.email}
      current="registration"
      eventId={event.id}
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
          <EventBreadcrumbs
            eventId={event.id}
            eventName={event.name}
            current="Registration"
          />
          <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Adjust the registration questions for this event. Fixed fields are
            always collected.
          </p>
        </section>

        <RegistrationFieldsEditor eventId={event.id} initialFields={fields} />
      </div>
    </DashboardShell>
  );
}



