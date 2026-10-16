import type { PriceListDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListForm } from "./price-list-form";

export type PriceListDialogProps = {
  /** Present = edit mode, absent = create mode. */
  priceList?: PriceListDto | undefined;
  data: PriceListFormData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PriceListDialog({ priceList, data, open, onOpenChange }: PriceListDialogProps) {
  const t = useTranslations("priceList");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{priceList ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {priceList ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <PriceListForm priceList={priceList} data={data} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
