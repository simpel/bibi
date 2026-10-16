import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { QuickBookingData } from "./quick-booking-data";
import { QuickBookingForm } from "./quick-booking-form";

export type QuickBookingDialogProps = {
  data: QuickBookingData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickBookingDialog({ data, open, onOpenChange }: QuickBookingDialogProps) {
  const t = useTranslations("booking");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createQuick")}</DialogTitle>
          <DialogDescription>{t("quickDescription")}</DialogDescription>
        </DialogHeader>
        <QuickBookingForm data={data} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
