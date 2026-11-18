"use client";

import type { LineHoursCheck } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";

export type OutsideHoursDialogProps = {
  /** Which hours the line falls outside; null = closed. */
  kind: LineHoursCheck["kind"];
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** "The venue is closed then. Save anyway?": the line is saved only on yes. */
export function OutsideHoursDialog({
  kind,
  pending,
  onConfirm,
  onCancel,
}: OutsideHoursDialogProps) {
  const t = useTranslations("line.outsideHours");
  return (
    <ConfirmDialog
      open={kind !== null}
      onOpenChange={(open) => (open ? null : onCancel())}
      title={kind === "OUTSIDE_ITEM_HOURS" ? t("itemTitle") : t("venueTitle")}
      description={t("description")}
      confirmLabel={t("confirm")}
      variant="default"
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}
