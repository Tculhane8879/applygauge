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
    <section className="mt-8" aria-labelledby="status-history-heading">
      <h3 className="text-xl font-semibold" id="status-history-heading">
        Status history
      </h3>
      {!events || events.length === 0 ? (
        <p className="mt-3 text-slate-600" role="status">
          Status history is unavailable.
        </p>
      ) : (
        <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-5">
          {events.map((event) => (
            <li key={event.id}>
              <p className="font-medium text-slate-900">
                {event.from_status
                  ? `${applicationStatusLabel(event.from_status)} → ${applicationStatusLabel(event.to_status)}`
                  : applicationStatusLabel(event.to_status)}
              </p>
              <time
                className="mt-1 block text-sm text-slate-600"
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
