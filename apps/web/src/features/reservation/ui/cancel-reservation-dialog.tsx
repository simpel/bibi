"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useReservationState } from "./use-reservation-state";

export type CancelReservationDialogProps = {
  id: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Cancel asks first: the tables are released and the booker is told. */
export function CancelReservationDialog({
  id,
  name,
  open,
  onOpenChange,
}: CancelReservationDialogProps) {
  const t = useTranslations("reservation.cancel");
  const { cancel, pending } = useReservationState({ onDone: () => onOpenChange(false) });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title", { name })}
      description={t("description")}
      confirmLabel={t("confirm")}
      pending={pending}
      onConfirm={() => cancel({ id })}
    />
  );
}
