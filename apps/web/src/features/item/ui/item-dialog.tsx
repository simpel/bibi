import type { ItemDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ItemForm } from "./item-form";
import type { ItemFormData } from "./item-form-data";

export type ItemDialogProps = {
  data: ItemFormData;
  /** Present = edit mode, absent = create mode. */
  item?: ItemDto | undefined;
  typeId?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ItemDialog({ open, onOpenChange, item, ...rest }: ItemDialogProps) {
  const t = useTranslations("item");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {item ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <ItemForm item={item} onDone={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}
