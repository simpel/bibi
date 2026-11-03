import {
  addDays,
  type BillingOrganizationDto,
  BillingOrganizationUpdateInputSchema,
  FALLBACK_TIME_ZONE,
  fromZonedParts,
  parseIsoDate,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateBillingOrganizationAction } from "./actions";

/** The last trial day (`YYYY-MM-DD`) in Bibi's own zone; the trial ends when that day ends. */
export type TrialEndFormValues = { organizationId: string; trialEndsAt: string };
const TrialEndInputSchema = BillingOrganizationUpdateInputSchema.pick({
  organizationId: true,
  trialEndsAt: true,
});
export type TrialEndFormOutput = z.infer<typeof TrialEndInputSchema>;

const ZONE = { timeZone: FALLBACK_TIME_ZONE } as const;
const MIDNIGHT = { hour: 0, minute: 0, second: 0 } as const;

const dayEnd = ({ day }: { day: string }): Date | string => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? parseIsoDate({ value: day }) : null;
  return date ? fromZonedParts({ date: addDays({ date, days: 1 }), time: MIDNIGHT, ...ZONE }) : day;
};

const trialEndSchema = formSchema({
  schema: TrialEndInputSchema,
  toInput: ({ values }: { values: TrialEndFormValues }) => ({
    organizationId: values.organizationId,
    trialEndsAt: dayEnd({ day: values.trialEndsAt }),
  }),
});

/** The day the trial ends on, shown as its last day (an end at midnight belongs to the day before). */
const lastDay = ({ instant }: { instant: Date }): string =>
  toIsoDate({ date: toZonedParts({ instant: new Date(instant.getTime() - 1), ...ZONE }).date });

export type UseTrialEndFormInput = { organization: BillingOrganizationDto; onSaved: () => void };

/** Form state for `billingOrganization.update` with a new trial end. */
export function useTrialEndForm({ organization, onSaved }: UseTrialEndFormInput) {
  const t = useTranslations("admin.billing.organizations");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<TrialEndFormValues, unknown, TrialEndFormOutput>({
    resolver: zodResolver(trialEndSchema, useZodMessages()),
    defaultValues: {
      organizationId: organization.organizationId,
      trialEndsAt: lastDay({ instant: organization.trialEndsAt }),
    },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateBillingOrganizationAction({ input: values }),
    messages: { pending: common("saving"), success: t("trialSaved") },
    onSuccess: () => {
      onSaved();
      router.refresh();
    },
  });
  return { form, submit, pending };
}
