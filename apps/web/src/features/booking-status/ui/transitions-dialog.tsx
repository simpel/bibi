import type { BookingStatusDto } from "@okazi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TransitionsForm } from "./transitions-form";

export type TransitionsDialogProps = {
  status: BookingStatusDto;
  /** Every active status; the status itself is left out of the choices. */
  statuses: readonly BookingStatusDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Which statuses a booking may move to from `status` (replaced as a set). */
export function TransitionsDialog({
  status,
  statuses,
  open,
  onOpenChange,
}: TransitionsDialogProps) {
  const t = useTranslations("bookingStatus");
  const targets = statuses.filter((candidate) => candidate.id !== status.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTransitions")}</DialogTitle>
          <DialogDescription>
            {t("transitionsDescription", { name: status.name })}
          </DialogDescription>
        </DialogHeader>
        <TransitionsForm status={status} targets={targets} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
