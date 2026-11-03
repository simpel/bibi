import { type BillingConfigDto, BillingConfigUpdateInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateBillingConfigAction } from "./actions";

/** Raw values with the schema's names; a blank secret keeps the stored one. */
export type BillingConfigFormValues = {
  secretKey: string;
  webhookSecret: string;
  basePriceMonthlyId: string;
  basePriceYearlyId: string;
  seatPriceId: string;
};
export type BillingConfigFormOutput = z.infer<typeof BillingConfigUpdateInputSchema>;

const blankToUndefined = ({ value }: { value: string }) =>
  value.trim() === "" ? undefined : value;

const billingConfigSchema = formSchema({
  schema: BillingConfigUpdateInputSchema,
  toInput: ({ values }: { values: BillingConfigFormValues }) =>
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, blankToUndefined({ value })]),
    ),
});

type ConfigInput = { config: BillingConfigDto };

const defaults = ({ config }: ConfigInput): BillingConfigFormValues => ({
  secretKey: "",
  webhookSecret: "",
  basePriceMonthlyId: config.basePriceMonthlyId ?? "",
  basePriceYearlyId: config.basePriceYearlyId ?? "",
  seatPriceId: config.seatPriceId ?? "",
});

/** Form state for `billingConfig.update`; the secret fields are emptied after a save. */
export function useBillingConfigForm({ config }: ConfigInput) {
  const t = useTranslations("admin.billing.config");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<BillingConfigFormValues, unknown, BillingConfigFormOutput>({
    resolver: zodResolver(billingConfigSchema, useZodMessages()),
    defaultValues: defaults({ config }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateBillingConfigAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: ({ value }) => {
      form.reset(defaults({ config: value }));
      router.refresh();
    },
  });
  return { form, submit, pending };
}
