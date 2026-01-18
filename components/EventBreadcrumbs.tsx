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
      <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
        <li>
          <Link href="/dashboard" className="transition hover:text-[#1b1a18]">
            Dashboard
          </Link>
        </li>
        <li className="text-[#b7a79a]">/</li>
        <li>
          <Link
            href={`/dashboard/events/${eventId}/overview`}
            className="transition hover:text-[#1b1a18]"
          >
            {eventName}
          </Link>
        </li>
        <li className="text-[#b7a79a]">/</li>
        <li className="text-[#1b1a18]">{current}</li>
      </ol>
    </nav>
  );
}
