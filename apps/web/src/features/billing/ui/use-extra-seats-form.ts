import type { BillingDto } from "@bibi/core";
import { BillingUpdateInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateBillingAction } from "../actions";

/** Raw value: the field carries the schema's name so a server issue lands on it. */
export type ExtraSeatsFormValues = { extraSeats: string };
const ExtraSeatsInputSchema = BillingUpdateInputSchema.pick({ extraSeats: true }).required();
export type ExtraSeatsFormOutput = z.infer<typeof ExtraSeatsInputSchema>;

const extraSeatsSchema = formSchema({
  schema: ExtraSeatsInputSchema,
  toInput: ({ values }: { values: ExtraSeatsFormValues }) => ({
    extraSeats: values.extraSeats.trim() === "" ? Number.NaN : Number(values.extraSeats),
  }),
});

export type UseExtraSeatsFormInput = {
  extraSeats: number;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: ((input: { value: BillingDto }) => void) | undefined;
};

/** Form state for `billing.update` with only the extra seats. */
export function useExtraSeatsForm({ extraSeats, onSaved }: UseExtraSeatsFormInput) {
  const t = useTranslations("billing.settings");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<ExtraSeatsFormValues, unknown, ExtraSeatsFormOutput>({
    resolver: zodResolver(extraSeatsSchema, useZodMessages()),
    defaultValues: { extraSeats: String(extraSeats) },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateBillingAction({ input: values }),
    messages: { pending: common("saving"), success: t("seatsSaved") },
    onSuccess: ({ value }) => (onSaved ? onSaved({ value }) : router.refresh()),
    confirm: ({ values }) => [
      { field: t("extraSeats"), before: String(extraSeats), after: String(values.extraSeats) },
    ],
  });
  return { form, submit, pending };
}
