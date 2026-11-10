import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type {
  RequestPaymentFormOutput,
  RequestPaymentFormValues,
} from "./use-request-payment-form";

export type PaymentMethodFieldProps = {
  form: UseFormReturn<RequestPaymentFormValues, unknown, RequestPaymentFormOutput>;
};

/** The method prepared first: card (a checkout link to send) or Swish; invoices use invoice.send. */
export function PaymentMethodField({ form }: PaymentMethodFieldProps) {
  const t = useTranslations("payment");
  return (
    <FormController
      control={form.control}
      name="method"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.method")}</FormLabel>
          <Select
            value={field.value}
            onValueChange={(next) => field.onChange(next === "SWISH" ? "SWISH" : "CARD")}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="CARD">{t("method.CARD")}</SelectItem>
              <SelectItem value="SWISH">{t("method.SWISH")}</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
