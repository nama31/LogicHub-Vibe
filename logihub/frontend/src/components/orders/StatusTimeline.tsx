"use client";

// Renders the audit trail from order_status_log
// Shows: old_status → new_status, who changed, changed_at

interface StatusEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_at: string;
}

interface StatusTimelineProps {
  orderId: string;
  entries?: StatusEntry[];
}

export function StatusTimeline({ entries = [] }: StatusTimelineProps) {
  return (
    <ol aria-label="История статусов">
      {entries.map((e) => (
        <li key={e.id}>
          <span>{e.old_status ?? "—"}</span>
          {" → "}
          <span>{e.new_status}</span>
          <time dateTime={e.changed_at}>{e.changed_at}</time>
        </li>
      ))}
    </ol>
  );
}
