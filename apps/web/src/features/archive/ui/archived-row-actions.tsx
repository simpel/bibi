"use client";

import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DeleteRecordDialog } from "@/components/danger-area/delete-record-dialog";
import { deleteRecordAction, restoreRecordAction } from "@/features/lifecycle/actions";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import type { ArchivedRow } from "./archived-row";

type UseArchivedRecordInput = { record: ArchivedRow };

/** Restore and permanent delete of one archived row, each in the one-toast flow. */
function useArchivedRecord({ record }: UseArchivedRecordInput) {
  const t = useTranslations("common.lifecycle");
  const router = useRouter();
  const restore = useToastAction();
  const remove = useToastAction();
  const [deleting, setDeleting] = useState(false);
  const { kind } = record;
  const onRestore = () =>
    restore.run({
      action: () => restoreRecordAction({ kind, id: record.id }),
      messages: { pending: t("restoring"), success: t("restored") },
      onSuccess: () => router.refresh(),
    });
  const onDelete = () => {
    remove.run({
      action: () => deleteRecordAction({ kind, id: record.id }),
      messages: { pending: t("deleting"), success: t("deleted") },
      errorMessage: ({ error }) => (error.code === "CONFLICT" ? error.message : null),
      onSuccess: () => {
        setDeleting(false);
        router.refresh();
      },
    });
  };
  return { t, restore, remove, deleting, setDeleting, onRestore, onDelete };
}

export type ArchivedRowActionsProps = { record: ArchivedRow };

/** Restore and Delete permanently of one archived record. */
export function ArchivedRowActions({ record }: ArchivedRowActionsProps) {
  const common = useTranslations("common");
  const { t, restore, remove, deleting, setDeleting, onRestore, onDelete } = useArchivedRecord({
    record,
  });
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={[
          {
            label: t("restore"),
            icon: RotateCcwIcon,
            onClick: onRestore,
            disabled: restore.pending,
          },
          {
            label: t("delete"),
            icon: Trash2Icon,
            onClick: () => setDeleting(true),
            destructive: true,
          },
        ]}
      />
      <DeleteRecordDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={record.name}
        pending={remove.pending}
        onConfirm={onDelete}
      />
    </>
  );
}

/** The same two actions in the row's context menu; the delete dialog stays in the actions cell. */
export function ArchivedRowMenu({ record }: ArchivedRowActionsProps) {
  const { t, remove, deleting, setDeleting, onRestore, onDelete } = useArchivedRecord({ record });
  return (
    <>
      <ContextMenuItem onSelect={onRestore}>
        <RotateCcwIcon />
        {t("restore")}
      </ContextMenuItem>
      <ContextMenuItem destructive onSelect={() => setDeleting(true)}>
        <Trash2Icon />
        {t("delete")}
      </ContextMenuItem>
      <DeleteRecordDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={record.name}
        pending={remove.pending}
        onConfirm={onDelete}
      />
    </>
  );
}
