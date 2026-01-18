import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import PasswordChangeForm from "@/components/PasswordChangeForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <DashboardShell userEmail={user.email} current="settings" eventId={null}>
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
            Security and access
          </h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
            Keep your credentials and account access up to date.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Password
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
              Update your password
            </h2>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              Use a strong password with at least 8 characters.
            </p>
            <PasswordChangeForm />
          </section>

          <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Account
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
              Profile details
            </h2>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              Signed in as {user.email}. Update your email from the profile page.
            </p>
            <Link
              href="/dashboard/profile"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[#1b1a18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
            >
              Open profile
            </Link>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
