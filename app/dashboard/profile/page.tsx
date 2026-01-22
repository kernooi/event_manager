import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

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
        <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Profile
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
            Account details
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Review the account information tied to your workspace access.
          </p>
        </section>

        <section className="rounded-2xl border border-[#d6dbe7] bg-white p-6 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.25)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Account details
          </p>
          <div className="mt-4 grid gap-3 text-sm text-[#64748b] sm:grid-cols-2">
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                Email
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0f172a]">
                {user.email}
              </p>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                Member since
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0f172a]">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
                Account ID
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-[#0f172a]">
                {user.id}
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}



