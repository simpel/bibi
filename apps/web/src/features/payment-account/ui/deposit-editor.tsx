"use client";

import { type PaymentSettingsDto, PaymentSettingsUpdateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { TextField } from "@/components/form/text-field";
import { minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updatePaymentSettingsAction } from "../actions";

/** Raw text; the minimum is typed in kronor and sent in öre. Field names match the schema. */
type DepositFormValues = { depositPercent: string; depositMinimumMinor: string };

const DepositInputSchema = PaymentSettingsUpdateInputSchema.pick({
  depositPercent: true,
  depositMinimumMinor: true,
});
type DepositFormOutput = z.infer<typeof DepositInputSchema>;

const depositSchema = formSchema({
  schema: DepositInputSchema,
  toInput: ({ values }: { values: DepositFormValues }) => ({
    depositPercent: numberOrNull({ value: values.depositPercent }),
    depositMinimumMinor: minorOrNull({ value: values.depositMinimumMinor }),
  }),
});

export type DepositEditorProps = {
  depositPercent: number | null;
  depositMinimumMinor: number | null;
  canEdit: boolean;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: ((input: { value: PaymentSettingsDto }) => void) | undefined;
};

/** The deposit rule (`paymentSettings.update` with only its two fields, ADR 0090). */
export function DepositEditor({
  depositPercent,
  depositMinimumMinor,
  canEdit,
  onSaved,
}: DepositEditorProps) {
  const t = useTranslations("paymentSettings");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<DepositFormValues, unknown, DepositFormOutput>({
    resolver: zodResolver(depositSchema, useZodMessages()),
    defaultValues: {
      depositPercent: depositPercent === null ? "" : String(depositPercent),
      depositMinimumMinor: depositMinimumMinor === null ? "" : String(depositMinimumMinor / 100),
    },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updatePaymentSettingsAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: ({ value }) => (onSaved ? onSaved({ value }) : router.refresh()),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-lg gap-4">
        <fieldset disabled={!canEdit} className="grid gap-4">
          <TextField
            form={form}
            name="depositPercent"
            label={t("fields.depositPercent")}
            type="number"
            step="1"
            placeholder={t("placeholders.none")}
          />
          <TextField
            form={form}
            name="depositMinimumMinor"
            label={t("fields.depositMinimum")}
            type="number"
            step="0.01"
            placeholder={t("placeholders.none")}
          />
          <p className="-mt-2 text-xs text-muted-foreground">{t("hints.depositMinimum")}</p>
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending}>
              {t("save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
        )}
      </form>
    </Form>
  );
}
