import DashboardShell from "@/components/DashboardShell";

export default function DashboardLoading() {
  return (
    <DashboardShell
      userEmail="loading@event.com"
      current="overview"
      eventId={null}
      showProfileMenu={false}
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-[#d6dbe7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]">
          <div className="animate-pulse">
            <div className="h-3 w-28 rounded-full bg-[#e2e8f0]" />
            <div className="mt-3 h-7 w-64 rounded-full bg-[#e2e8f0]" />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`stat-${index}`}
                  className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                >
                  <div className="h-3 w-20 rounded-full bg-[#e2e8f0]" />
                  <div className="mt-3 h-7 w-16 rounded-full bg-[#e2e8f0]" />
                  <div className="mt-2 h-3 w-32 rounded-full bg-[#e2e8f0]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {Array.from({ length: 2 }).map((_, index) => (
            <section
              key={`panel-${index}`}
              className="rounded-3xl border border-[#d6dbe7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-3 w-24 rounded-full bg-[#e2e8f0]" />
                <div className="h-6 w-48 rounded-full bg-[#e2e8f0]" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <div
                      key={`row-${index}-${rowIndex}`}
                      className="h-12 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc]"
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}


