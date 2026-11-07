import { type PaymentSettingsDto, PaymentSettingsUpdateInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updatePaymentSettingsAction } from "../actions";

export type ProviderChoice = "AUTO" | "STRIPE" | "FORTNOX";

/**
 * Raw values. The fields carry the schema's names so server issues land on them; the minimum
 * is typed in kronor and sent in öre.
 */
export type PaymentSettingsFormValues = {
  depositPercent: string;
  depositMinimumMinor: string;
  invoiceProvider: ProviderChoice;
};
export type PaymentSettingsFormOutput = z.infer<typeof PaymentSettingsUpdateInputSchema>;

const paymentSettingsSchema = formSchema({
  schema: PaymentSettingsUpdateInputSchema,
  toInput: ({ values }: { values: PaymentSettingsFormValues }) => ({
    depositPercent: numberOrNull({ value: values.depositPercent }),
    depositMinimumMinor: minorOrNull({ value: values.depositMinimumMinor }),
    invoiceProvider: values.invoiceProvider === "AUTO" ? null : values.invoiceProvider,
  }),
});

export type PaymentSettingsDefaultsInput = { settings: PaymentSettingsDto };

export type UsePaymentSettingsFormInput = PaymentSettingsDefaultsInput & {
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: ((input: { value: PaymentSettingsDto }) => void) | undefined;
};

/** Saved settings as raw form text. */
export function paymentSettingsDefaults({
  settings,
}: PaymentSettingsDefaultsInput): PaymentSettingsFormValues {
  const { depositPercent, depositMinimumMinor, invoiceProvider } = settings;
  return {
    depositPercent: depositPercent === null ? "" : String(depositPercent),
    depositMinimumMinor: depositMinimumMinor === null ? "" : String(depositMinimumMinor / 100),
    invoiceProvider: invoiceProvider ?? "AUTO",
  };
}

/** Form state for `paymentSettings.update`. */
export function usePaymentSettingsForm({ settings, onSaved }: UsePaymentSettingsFormInput) {
  const t = useTranslations("paymentSettings");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<PaymentSettingsFormValues, unknown, PaymentSettingsFormOutput>({
    resolver: zodResolver(paymentSettingsSchema, useZodMessages()),
    defaultValues: paymentSettingsDefaults({ settings }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updatePaymentSettingsAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: ({ value }) => (onSaved ? onSaved({ value }) : router.refresh()),
  });
  return { form, submit, pending };
}
