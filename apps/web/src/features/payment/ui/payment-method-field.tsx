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
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type {
  RequestPaymentFormOutput,
  RequestPaymentFormValues,
} from "./use-request-payment-form";

export type PaymentMethodFieldProps = {
  form: UseFormReturn<RequestPaymentFormValues, unknown, RequestPaymentFormOutput>;
};

/** Card (a checkout link to send) or invoice (Stripe emails it to the customer). */
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
            onValueChange={(next) => field.onChange(next === "INVOICE" ? "INVOICE" : "CARD")}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="CARD">{t("method.CARD")}</SelectItem>
              <SelectItem value="INVOICE">{t("method.INVOICE")}</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
