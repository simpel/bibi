import type { BookingStatusDto } from "@okazi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { BookingStatusForm } from "./booking-status-form";

export type BookingStatusDialogProps = {
  /** Present = edit mode, absent = create mode. */
  status?: BookingStatusDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingStatusDialog({ status, open, onOpenChange }: BookingStatusDialogProps) {
  const t = useTranslations("bookingStatus");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{status ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {status ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <BookingStatusForm status={status} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
