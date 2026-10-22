"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { StepWizard } from "@/components/wizard/step-wizard";
import { ROUTES, venueRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createVenueAction } from "../actions";
import { useVenueForm } from "./use-venue-form";
import { venueSteps } from "./venue-wizard-steps";

/** Create a venue step by step: name, address, then contact details and VAT. */
export function VenueWizard() {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useVenueForm({});
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => createVenueAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => router.push(venueRoute({ id: value.id })),
  });
  const text = ({ id }: { id: string }) => ({
    label: t(`wizard.steps.${id as "identity"}`),
    description: t(`wizard.descriptions.${id as "identity"}`),
  });
  return (
    <StepWizard
      form={form}
      run={run}
      pending={pending}
      cancelHref={ROUTES.venues}
      progressLabel={t("wizard.progress")}
      steps={venueSteps({ form, text })}
    />
  );
}
