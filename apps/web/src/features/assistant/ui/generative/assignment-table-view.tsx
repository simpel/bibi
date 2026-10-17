"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useAssignmentCardColumns } from "./use-assignment-card-columns";

export type AssignmentTableViewProps = GenerativeProps<"assignment-table">;

/** Assignments of one subject, or the member's own; subjects link to their page. */
export function AssignmentTableView({ items, nextCursor }: AssignmentTableViewProps) {
  const t = useTranslations("assistant.ui.assignment");
  const columns = useAssignmentCardColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="assignment-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.assignment"
        columns={columns}
        data={items}
        getRowId={(assignment) => assignment.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
