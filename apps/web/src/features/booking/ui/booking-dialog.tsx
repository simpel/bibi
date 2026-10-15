import type { BookingDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { BookingForm } from "./booking-form";
import type { BookingFormData } from "./booking-form-data";

export type BookingDialogProps = {
  data: BookingFormData;
  /** Present = edit mode, absent = create mode. */
  booking?: BookingDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingDialog({ open, onOpenChange, booking, data }: BookingDialogProps) {
  const t = useTranslations("booking");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {booking ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <BookingForm data={data} booking={booking} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
