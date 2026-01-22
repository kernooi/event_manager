import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import PasswordChangeForm from "@/components/PasswordChangeForm";
import ProfileEmailForm from "@/components/ProfileEmailForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <DashboardShell userEmail={user.email} current="settings" eventId={null}>
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
            Security and access
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Keep your credentials and account access up to date.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
              Password
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#0f172a]">
              Update your password
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">
              Use a strong password with at least 8 characters.
            </p>
            <PasswordChangeForm />
          </section>

          <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
              Account
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#0f172a]">
              Update email
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">
              Signed in as {user.email}. Updating your email will change the
              address used to sign in.
            </p>
            <ProfileEmailForm initialEmail={user.email} />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}



