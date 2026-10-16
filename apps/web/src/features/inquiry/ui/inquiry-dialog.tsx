import type { InquiryDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { InquiryForm } from "./inquiry-form";
import type { InquiryFormData } from "./inquiry-form-data";

export type InquiryDialogProps = {
  data: InquiryFormData;
  /** Present = edit mode, absent = create mode. */
  inquiry?: InquiryDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InquiryDialog({ open, onOpenChange, inquiry, data }: InquiryDialogProps) {
  const t = useTranslations("inquiry");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inquiry ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {inquiry ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <InquiryForm data={data} inquiry={inquiry} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
