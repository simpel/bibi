"use client";

import { Card } from "@okazi/ui";
import { AuditEntry } from "@/features/audit-log/ui/audit-entry";
import type { GenerativeProps } from "./generative-props";

export type AuditLogCardViewProps = GenerativeProps<"audit-log-card">;

/** One audit log entry: who changed what, and the diff. */
export function AuditLogCardView({ entry }: AuditLogCardViewProps) {
  return (
    <Card data-slot="audit-log-card" className="px-4 shadow-none">
      <AuditEntry entry={entry} />
    </Card>
  );
}
