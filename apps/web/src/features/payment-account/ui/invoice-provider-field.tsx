import {
  FormControl,
  FormController,
  FormDescription,
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
  PaymentSettingsFormOutput,
  PaymentSettingsFormValues,
  ProviderChoice,
} from "./use-payment-settings-form";

const CHOICES: readonly ProviderChoice[] = ["AUTO", "STRIPE", "FORTNOX"];

const toChoice = ({ value }: { value: string }): ProviderChoice =>
  CHOICES.find((choice) => choice === value) ?? "AUTO";

export type InvoiceProviderFieldProps = {
  form: UseFormReturn<PaymentSettingsFormValues, unknown, PaymentSettingsFormOutput>;
};

/** Which connected system raises invoices: Stripe, Fortnox or whichever is connected. */
export function InvoiceProviderField({ form }: InvoiceProviderFieldProps) {
  const t = useTranslations("paymentSettings");
  return (
    <FormController
      control={form.control}
      name="invoiceProvider"
      render={({ field }) => (
        <FormItem className="max-w-sm">
          <FormLabel>{t("fields.invoiceProvider")}</FormLabel>
          <Select
            value={field.value}
            onValueChange={(next) => field.onChange(toChoice({ value: next }))}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CHOICES.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {t(`provider.${choice}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>{t("hints.invoiceProvider")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
