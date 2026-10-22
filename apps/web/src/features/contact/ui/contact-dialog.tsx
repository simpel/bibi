import type { ContactDto } from "@bibi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { ContactForm } from "./contact-form";

export type ContactDialogProps = {
  customerId: string;
  data: TypedFormData;
  /** Present = edit mode, absent = create mode. */
  contact?: ContactDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContactDialog({ open, onOpenChange, contact, ...rest }: ContactDialogProps) {
  const t = useTranslations("contact");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {contact ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <ContactForm contact={contact} onDone={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}
