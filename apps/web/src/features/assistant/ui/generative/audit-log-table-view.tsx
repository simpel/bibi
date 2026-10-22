"use client";

import { Card } from "@bibi/ui";
import { AuditEntryList } from "@/features/audit-log/ui/audit-entry-list";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type AuditLogTableViewProps = GenerativeProps<"audit-log-table">;

/** A page of the change history (audit log), newest first. */
export function AuditLogTableView({ items, nextCursor }: AuditLogTableViewProps) {
  return (
    <Card data-slot="audit-log-table" className="px-4 shadow-none">
      <AuditEntryList entries={items} />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
