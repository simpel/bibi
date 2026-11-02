import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { DraftLine } from "./draft-line";
import type { DraftLineRow } from "./draft-line-cells";

export type LineActionsProps = {
  row: DraftLineRow;
  onEdit: (input: { line: DraftLine }) => void;
  onRemove: (input: { key: string }) => void;
};

/**
 * A draft line's row menu: Edit opens the line dialog; Remove line asks first, then drops the
 * line from the draft (nothing is saved until Create).
 */
export function LineActions({ row, onEdit, onRemove }: LineActionsProps) {
  const common = useTranslations("common");
  const t = useTranslations("ticketIntake.line");
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => onEdit({ line: row.line })}>
          <PencilIcon aria-hidden="true" />
          {common("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setConfirming(true)}>
          <Trash2Icon aria-hidden="true" />
          {t("remove")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("removeTitle", { name: row.line.name })}
        description={t("removeDescription")}
        confirmLabel={t("remove")}
        pending={false}
        onConfirm={() => {
          setConfirming(false);
          onRemove({ key: row.line.key });
        }}
      />
    </>
  );
}
