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
      <div className="min-h-screen bg-[#f4efe4] px-6 py-16 text-[#1b1a18]">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e3d6c8] bg-white p-8 text-center shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Invite Invalid
          </p>
          <h1 className="mt-3 text-2xl font-semibold">This invite is no longer available.</h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
            Please contact the event organizer for a new invite.
          </p>
        </div>
      </div>
    );
  }

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return (
      <div className="min-h-screen bg-[#f4efe4] px-6 py-16 text-[#1b1a18]">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e3d6c8] bg-white p-8 text-center shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Invite Expired
          </p>
          <h1 className="mt-3 text-2xl font-semibold">This invite has expired.</h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
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
    <div className="min-h-screen bg-[#f4efe4] px-6 py-16 text-[#1b1a18]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-start">
        <section className="flex max-w-xl flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Private Invitation
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-[#1b1a18]">
            {invite.event.name}
          </h1>
          <p className="text-lg text-[#4a3e35]">
            You are invited to register for this event. Complete the form to
            confirm your attendance.
          </p>
          <div className="rounded-2xl border border-[#d7c5b4] bg-white/70 p-6 text-sm text-[#6b5a4a] shadow-[0_20px_50px_-40px_rgba(27,26,24,0.6)]">
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
