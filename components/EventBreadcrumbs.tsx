import Link from "next/link";

type EventBreadcrumbsProps = {
  eventId: string;
  eventName: string;
  current: string;
};

export default function EventBreadcrumbs({
  eventId,
  eventName,
  current,
}: EventBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#4c5b78]">
        <li>
          <Link href="/dashboard" className="transition hover:text-[#0f172a]">
            Dashboard
          </Link>
        </li>
        <li className="text-[#94a3b8]">/</li>
        <li>
          <Link
            href={`/dashboard/events/${eventId}/overview`}
            className="transition hover:text-[#0f172a]"
          >
            {eventName}
          </Link>
        </li>
        <li className="text-[#94a3b8]">/</li>
        <li className="text-[#0f172a]">{current}</li>
      </ol>
    </nav>
  );
}


