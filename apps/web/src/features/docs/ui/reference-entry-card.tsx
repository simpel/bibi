import { useState } from "react";
import type { ReferenceEntry } from "../reference/types";
import { EntryBody } from "./entry-body";

export type ReferenceEntryCardProps = { entry: ReferenceEntry };

/** One tool; the details render only once opened (the reference has 100+ tools). */
export function ReferenceEntryCard({ entry }: ReferenceEntryCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <details
      id={entry.id}
      className="min-w-0 scroll-mt-20 rounded-lg border bg-card"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 p-3 hover:bg-muted/50">
        <code className="font-mono text-sm font-medium break-all">{entry.toolName}</code>
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {entry.summary}
        </span>
      </summary>
      {open && <EntryBody entry={entry} />}
    </details>
  );
}
