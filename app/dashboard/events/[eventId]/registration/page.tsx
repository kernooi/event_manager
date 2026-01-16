import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RegistrationFieldsEditor from "@/components/RegistrationFieldsEditor";

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
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Registration Form
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
            Adjust the registration questions for this event. Fixed fields are
            always collected.
          </p>
        </section>

        <RegistrationFieldsEditor eventId={event.id} initialFields={fields} />
      </div>
    </DashboardShell>
  );
}
