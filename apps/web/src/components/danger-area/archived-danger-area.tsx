"use client";

import { Button, DangerZone, DangerZoneRow } from "@bibi/ui";
import { RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { deleteRecordAction, restoreRecordAction } from "@/features/lifecycle/actions";
import type { LifecycleKind } from "@/features/lifecycle/lifecycle-kinds";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { DeleteRecordDialog } from "./delete-record-dialog";

export type ArchivedDangerAreaProps = {
  kind: LifecycleKind;
  record: { id: string; name: string };
  /** Where the deleted record's page sends you: its list. */
  listHref: string;
};

/**
 * The danger area of an archived record (ADR 0118): Restore, and Delete permanently confirmed by
 * typing its name. A delete refused because another record refers to it shows why. Each
 * feature's `<Feature>DangerArea` renders this instead of its Archive row.
 */
export function ArchivedDangerArea({ kind, record, listHref }: ArchivedDangerAreaProps) {
  const t = useTranslations("common.lifecycle");
  const common = useTranslations("common");
  const router = useRouter();
  const restore = useToastAction();
  const remove = useToastAction();
  const [deleting, setDeleting] = useState(false);
  const onRestore = () =>
    restore.run({
      action: () => restoreRecordAction({ kind, id: record.id }),
      messages: { pending: t("restoring"), success: t("restored") },
      onSuccess: () => router.refresh(),
    });
  const onDelete = () =>
    remove.run({
      action: () => deleteRecordAction({ kind, id: record.id }),
      messages: { pending: t("deleting"), success: t("deleted") },
      errorMessage: ({ error }) => (error.code === "CONFLICT" ? error.message : null),
      onSuccess: () => {
        setDeleting(false);
        router.replace(listHref);
      },
    });
  return (
    <DangerZone title={common("dangerArea")}>
      <DangerZoneRow
        title={t("restore")}
        description={t("restoreDescription", { name: record.name })}
        action={
          <Button variant="outline" disabled={restore.pending} onClick={onRestore}>
            <RotateCcwIcon aria-hidden />
            {t("restore")}
          </Button>
        }
      />
      <DangerZoneRow
        title={t("delete")}
        description={t("deleteDescription")}
        action={
          <Button variant="outline" className="text-destructive" onClick={() => setDeleting(true)}>
            <Trash2Icon aria-hidden />
            {t("delete")}
          </Button>
        }
      />
      <DeleteRecordDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={record.name}
        pending={remove.pending}
        onConfirm={onDelete}
      />
    </DangerZone>
  );
}
