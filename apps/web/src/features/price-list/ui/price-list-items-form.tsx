import type { PriceListDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { NamedOption } from "@/components/form/named-option";
import { PriceListItemRows } from "./price-list-item-rows";
import { usePriceListItemsForm } from "./use-price-list-items-form";

export type PriceListItemsFormProps = {
  priceList: PriceListDto;
  items: readonly NamedOption[];
  onDone: () => void;
};

/** The agreed item prices, replaced as a set on save (`priceList.setItems`). */
export function PriceListItemsForm({ priceList, items, onDone }: PriceListItemsFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending } = usePriceListItemsForm({ priceList, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <PriceListItemRows form={form} items={items} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
