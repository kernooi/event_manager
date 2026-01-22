import { prisma } from "@/lib/prisma";
import InviteRegistrationForm from "@/components/InviteRegistrationForm";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      event: {
        include: {
          registrationFields: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!invite || invite.status === "USED") {
    return (
      <div className="min-h-screen bg-[#f5f7fb] px-6 py-16 text-[#0f172a]">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#d6dbe7] bg-white p-8 text-center shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Invite Invalid
          </p>
          <h1 className="mt-3 text-2xl font-semibold">This invite is no longer available.</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Please contact the event organizer for a new invite.
          </p>
        </div>
      </div>
    );
  }

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] px-6 py-16 text-[#0f172a]">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#d6dbe7] bg-white p-8 text-center shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Invite Expired
          </p>
          <h1 className="mt-3 text-2xl font-semibold">This invite has expired.</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Contact the organizer for a new registration link.
          </p>
        </div>
      </div>
    );
  }

  const fields = invite.event.registrationFields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    options: Array.isArray(field.options)
      ? field.options.map(String)
      : null,
  }));

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-6 py-16 text-[#0f172a]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-start">
        <section className="flex max-w-xl flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Private Invitation
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-[#0f172a]">
            {invite.event.name}
          </h1>
          <p className="text-lg text-[#334155]">
            You are invited to register for this event. Complete the form to
            confirm your attendance.
          </p>
          <div className="rounded-2xl border border-[#d6dbe7] bg-white/70 p-6 text-sm text-[#64748b] shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
            After you submit, a QR code confirmation will be sent to your email.
          </div>
        </section>

        <InviteRegistrationForm
          token={invite.token}
          eventName={invite.event.name}
          fields={fields}
        />
      </div>
    </div>
  );
}


