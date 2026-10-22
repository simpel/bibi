import type { PriceListDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListIdentityFields, PriceListTermsFields } from "./price-list-step-fields";
import { usePriceListForm } from "./use-price-list-form";

export type PriceListFormProps = {
  priceList?: PriceListDto | undefined;
  data: PriceListFormData;
  onDone: () => void;
};

/** Name, customer, validity and the general discount (item prices are edited separately). */
export function PriceListForm({ priceList, data, onDone }: PriceListFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending } = usePriceListForm({ priceList, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <PriceListIdentityFields form={form} data={data} />
        <PriceListTermsFields form={form} />
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
