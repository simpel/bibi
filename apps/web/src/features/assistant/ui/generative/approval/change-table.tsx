"use client";

import type { ChangePreview } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import {
  type ApprovalEdits,
  applyEdits,
  type EditValue,
  editKind,
} from "../../../lib/approval-edits";
import { describeFieldChange, visibleFields } from "../../../lib/describe-change";
import { EditFieldDialog, type EditTarget } from "./edit-field-dialog";
import { type ChangeRow, useChangeColumns } from "./use-change-columns";

export type ChangeTableProps = {
  preview: ChangePreview;
  edits: ApprovalEdits;
  /** Absent once the proposal is decided: the rows lose their pens. */
  onEdit?: (input: { path: string; value: EditValue }) => void;
};

function rowsOf({ preview, edits }: { preview: ChangePreview; edits: ApprovalEdits }): ChangeRow[] {
  const shown = applyEdits({ preview, edits });
  return shown.changes.flatMap((change) =>
    visibleFields({ change }).map((field) => ({
      id: `${change.entityId}:${field.path}`,
      record: change.name ?? change.entityType,
      path: field.path,
      value: field.after,
      editKind: editKind({ preview, field }),
      ...describeFieldChange({ change: field, names: preview.names }),
    })),
  );
}

/** Exactly what the change does, field by field, as core computed it (ADR 0049). */
export function ChangeTable({ preview, edits, onEdit }: ChangeTableProps) {
  const t = useTranslations("assistant.approval.changes");
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const columns = useChangeColumns({
    records: preview.changes.length,
    onEdit: onEdit ? (target) => setEditing(target) : undefined,
  });
  const rows = rowsOf({ preview, edits });
  return (
    <div data-slot="approval-changes" className="overflow-hidden rounded-md border">
      <PersistedDataTable<ChangeRow, unknown>
        tableId="assistant.approval.changes"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyText={t("none")}
      />
      {editing && onEdit ? (
        <EditFieldDialog
          key={editing.path}
          target={editing}
          onSave={onEdit}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
