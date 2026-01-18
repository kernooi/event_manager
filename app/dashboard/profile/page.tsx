import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import ProfileEmailForm from "@/components/ProfileEmailForm";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <DashboardShell userEmail={user.email} current="profile" eventId={null}>
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Profile
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1b1a18]">
            Account profile
          </h1>
          <p className="mt-2 text-sm text-[#6b5a4a]">
            Manage your account details and sign-in email.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                Account details
              </p>
              <div className="mt-4 grid gap-3 text-sm text-[#5b4a3d]">
                <div className="rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1b1a18]">
                    {user.email}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                    Member since
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1b1a18]">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                    Account ID
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-[#1b1a18]">
                    {user.id}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
                Update email
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
                Keep your login current
              </h2>
              <p className="mt-2 text-sm text-[#6b5a4a]">
                Updating your email will change the address used to sign in.
              </p>
              <ProfileEmailForm initialEmail={user.email} />
            </section>
          </div>

          <section className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Security
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#1b1a18]">
              Update your password
            </h2>
            <p className="mt-2 text-sm text-[#6b5a4a]">
              Rotate your password regularly to keep the workspace secure.
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[#1b1a18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
            >
              Open settings
            </Link>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
