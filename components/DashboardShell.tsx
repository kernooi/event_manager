import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

type DashboardShellProps = {
  userEmail: string;
  current:
    | "overview"
    | "registration"
    | "invites"
    | "attendees"
    | "checkin"
    | "profile"
    | "settings"
    | "loading";
  eventId?: string | null;
  showProfileMenu?: boolean;
  children: React.ReactNode;
};

const navItems = [
  { key: "overview", label: "Overview" },
  { key: "registration", label: "Registration Form" },
  { key: "invites", label: "Invites" },
  { key: "attendees", label: "Attendees" },
  { key: "checkin", label: "Check-in" },
] as const;

export default function DashboardShell({
  userEmail,
  current,
  eventId,
  showProfileMenu = true,
  children,
}: DashboardShellProps) {
  const showEventNav = Boolean(eventId);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0f172a]">
      <header className="border-b border-[#d6dbe7] bg-[#f8fafc]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f172a] text-xs font-semibold uppercase tracking-[0.3em] text-[#f5f7fb]">
              EM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#4c5b78]">
                Event Manager
              </p>
              <p className="text-lg font-semibold">Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {showProfileMenu ? (
              <ProfileMenu email={userEmail} />
            ) : (
              <div
                className="h-11 w-11 rounded-full bg-[#e2e8f0] animate-pulse"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        {showEventNav ? (
          <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[#d6dbe7] bg-white p-3 text-sm shadow-[0_10px_24px_-16px_rgba(15,23,42,0.2)] lg:hidden">
            {navItems.map((item) => {
              const isActive = item.key === current;
              const basePath = eventId
                ? `/dashboard/events/${eventId}`
                : "/dashboard";
              const href =
                item.key === "overview"
                  ? `${basePath}/overview`
                  : `${basePath}/${item.key}`;

              return (
                <Link
                  key={item.key}
                  href={href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 transition ${
                    isActive
                      ? "bg-[#0f172a] text-[#f5f7fb]"
                      : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="flex w-full gap-6">
          {showEventNav ? (
            <aside className="hidden w-60 flex-col gap-2 rounded-xl border border-[#d6dbe7] bg-white p-4 text-sm shadow-[0_10px_24px_-16px_rgba(15,23,42,0.2)] lg:flex">
              <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
                Sections
              </p>
              {navItems.map((item) => {
                const isActive = item.key === current;
                const basePath = eventId
                  ? `/dashboard/events/${eventId}`
                  : "/dashboard";
                const href =
                  item.key === "overview"
                    ? `${basePath}/overview`
                    : `${basePath}/${item.key}`;

                return (
                  <Link
                    key={item.key}
                    href={href}
                    className={`rounded-lg px-3 py-2 transition ${
                      isActive
                        ? "bg-[#0f172a] text-[#f5f7fb]"
                        : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </aside>
          ) : null}

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}



