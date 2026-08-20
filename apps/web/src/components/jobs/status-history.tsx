import { type StatusEventRead } from "@/lib/api/jobs";
import {
  applicationStatusLabel,
  formatJobDateTime,
} from "@/lib/jobs/presentation";

export function StatusHistory({
  events,
}: {
  events: StatusEventRead[] | null;
}) {
  return (
    <section
      className="mt-10 border-t border-line pt-8"
      aria-labelledby="status-history-heading"
    >
      <h3
        className="text-xl font-semibold text-ink"
        id="status-history-heading"
      >
        Status history
      </h3>
      {!events || events.length === 0 ? (
        <p className="mt-3 text-muted" role="status">
          Status history is unavailable.
        </p>
      ) : (
        <ol className="mt-4 space-y-5 border-l border-indigo-200 pl-5">
          {events.map((event) => (
            <li
              className="relative before:absolute before:-left-6 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-brand"
              key={event.id}
            >
              <p className="font-medium text-ink">
                {event.from_status
                  ? `${applicationStatusLabel(event.from_status)} → ${applicationStatusLabel(event.to_status)}`
                  : applicationStatusLabel(event.to_status)}
              </p>
              <time
                className="mt-1 block text-sm text-muted"
                dateTime={event.changed_at}
              >
                {formatJobDateTime(event.changed_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
