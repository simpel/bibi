import { BillingConfigUpdateInputSchema } from "@bibi/core/schemas";
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

const DEFAULTS: BillingConfigFormValues = { secretKey: "", webhookSecret: "" };

export type UseBillingConfigFormInput = { onSaved?: (() => void) | undefined };

/** Form state for `billingConfig.update`; the secret fields are emptied after a save. */
export function useBillingConfigForm({ onSaved }: UseBillingConfigFormInput = {}) {
  const t = useTranslations("admin.billing.config");
  const router = useRouter();
  const form = useForm<BillingConfigFormValues, unknown, BillingConfigFormOutput>({
    resolver: zodResolver(billingConfigSchema, useZodMessages()),
    defaultValues: DEFAULTS,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateBillingConfigAction({ input: values }),
    messages: { pending: t("saving"), success: t("saved") },
    onSuccess: () => {
      form.reset(DEFAULTS);
      onSaved?.();
      router.refresh();
    },
  });
  return { form, submit, pending };
}
