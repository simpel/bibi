import type { PriceListDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { NamedOption } from "@/components/form/named-option";
import { PriceListItemsForm } from "./price-list-items-form";

export type PriceListItemsDialogProps = {
  priceList: PriceListDto;
  items: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PriceListItemsDialog({
  priceList,
  items,
  open,
  onOpenChange,
}: PriceListItemsDialogProps) {
  const t = useTranslations("priceList.items");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { name: priceList.name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <PriceListItemsForm
          priceList={priceList}
          items={items}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
