import type { PriceListDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { PriceListFormData } from "./load-price-list-form-data";
import { usePriceListForm } from "./use-price-list-form";

export type PriceListFormProps = {
  priceList?: PriceListDto | undefined;
  data: PriceListFormData;
  onDone: () => void;
};

/** Name, customer, validity and the general discount (item prices are edited separately). */
export function PriceListForm({ priceList, data, onDone }: PriceListFormProps) {
  const t = useTranslations("priceList");
  const common = useTranslations("common");
  const { form, submit, pending } = usePriceListForm({ priceList, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <OptionSelectField
          control={form.control}
          name="customerId"
          label={t("fields.customer")}
          options={data.customers}
          noneLabel={t("noCustomer")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="validFrom" label={t("fields.validFrom")} type="date" />
          <TextField form={form} name="validTo" label={t("fields.validTo")} type="date" />
        </div>
        <TextField
          form={form}
          name="discountPercent"
          label={t("fields.discountPercent")}
          type="number"
          step="0.01"
        />
        <p className="text-sm text-muted-foreground">{t("discountHint")}</p>
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
