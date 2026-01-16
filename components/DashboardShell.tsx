import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

type DashboardShellProps = {
  userEmail: string;
  current: "overview" | "registration" | "invites" | "attendees" | "checkin";
  eventId?: string | null;
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
  children,
}: DashboardShellProps) {
  const showEventNav = Boolean(eventId);
  return (
    <div className="min-h-screen bg-[#f4efe4] text-[#1b1a18]">
      <header className="border-b border-[#e3d6c8] bg-[#fbf8f2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b1a18] text-xs font-semibold uppercase tracking-[0.3em] text-[#f4efe4]">
              EM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#7a5b48]">
                Event Manager
              </p>
              <p className="text-lg font-semibold">Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {showEventNav ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-[#1b1a18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1a18] transition hover:bg-[#1b1a18] hover:text-[#f4efe4]"
              >
                Back
              </Link>
            ) : null}
            <ProfileMenu email={userEmail} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        {showEventNav ? (
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e3d6c8] bg-white/70 p-3 text-sm shadow-[0_20px_50px_-40px_rgba(27,26,24,0.6)] backdrop-blur lg:hidden">
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
                      ? "bg-[#1b1a18] text-[#f4efe4]"
                      : "text-[#5b4a3d] hover:bg-[#f8f1e8]"
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
            <aside className="hidden w-60 flex-col gap-2 rounded-2xl border border-[#e3d6c8] bg-white/70 p-4 text-sm shadow-[0_20px_50px_-40px_rgba(27,26,24,0.6)] backdrop-blur lg:flex">
              <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
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
                    className={`rounded-xl px-3 py-2 transition ${
                      isActive
                        ? "bg-[#1b1a18] text-[#f4efe4]"
                        : "text-[#5b4a3d] hover:bg-[#f8f1e8]"
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
