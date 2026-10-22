import type { ItemDto } from "@bibi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ItemForm } from "./item-form";
import type { ItemFormData } from "./item-form-data";

export type ItemDialogProps = {
  data: ItemFormData;
  /** Present = edit mode, absent = create mode. */
  item?: ItemDto | undefined;
  typeId?: string | undefined;
  /** Create mode: save as this customer's bundle. */
  customerId?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ItemDialog({ open, onOpenChange, item, ...rest }: ItemDialogProps) {
  const t = useTranslations("item");
  const mode = item ? "edit" : rest.customerId ? "saveBundle" : "create";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(mode)}</DialogTitle>
          <DialogDescription>{t(`${mode}Description`)}</DialogDescription>
        </DialogHeader>
        <ItemForm item={item} onDone={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}
