import type { ChangePreview } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { describeFieldChange } from "../../../lib/describe-change";
import { type ChangeRow, useChangeColumns } from "./use-change-columns";

export type ChangeTableProps = { preview: ChangePreview };

function rowsOf({ preview }: ChangeTableProps): ChangeRow[] {
  return preview.changes.flatMap((change) =>
    change.fields.map((field) => ({
      id: `${change.entityId}:${field.path}`,
      record: change.name ?? change.entityType,
      ...describeFieldChange({ change: field, names: preview.names }),
    })),
  );
}

/** Exactly what the change does, field by field, as core computed it (ADR 0049). */
export function ChangeTable({ preview }: ChangeTableProps) {
  const t = useTranslations("assistant.approval.changes");
  const columns = useChangeColumns({ records: preview.changes.length });
  const rows = rowsOf({ preview });
  return (
    <div data-slot="approval-changes" className="overflow-hidden rounded-md border">
      <PersistedDataTable<ChangeRow, unknown>
        tableId="assistant.approval.changes"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyText={t("none")}
      />
    </div>
  );
}
