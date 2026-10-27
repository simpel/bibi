"use client";

import { Card } from "@bibi/ui";
import { AuditEntry } from "@/features/audit-log/ui/audit-entry";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type AuditLogCardViewProps = GenerativeProps<"audit-log-card">;

/** One audit log entry: who changed what, and the diff. */
export function AuditLogCardView({ entry }: AuditLogCardViewProps) {
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="audit-log-card" className="px-4 shadow-none">
      <AuditEntry dates={dates} entry={entry} />
    </Card>
  );
}
