"use client";

import { useTranslations } from "next-intl";
import { StepWizard } from "@/components/wizard/step-wizard";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createWorkOrderDefinitionAction } from "../actions";
import { useWorkOrderDefinitionForm } from "./use-work-order-definition-form";
import { workOrderSteps } from "./work-order-definition-wizard-steps";
import type { WorkOrderOptions } from "./work-order-options";

export type WorkOrderDefinitionWizardProps = { options: WorkOrderOptions };

/** Create a work order step by step: name, what it contains, then who receives it. */
export function WorkOrderDefinitionWizard({ options }: WorkOrderDefinitionWizardProps) {
  const t = useTranslations("workOrderDefinition");
  const router = useRouter();
  const form = useWorkOrderDefinitionForm({});
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => createWorkOrderDefinitionAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: () => router.push(ROUTES.settingsWorkOrders),
  });
  const text = ({ id }: { id: string }) => ({
    id,
    label: t(`wizard.steps.${id as "name"}`),
    description: t(`wizard.descriptions.${id as "name"}`),
  });
  return (
    <StepWizard
      form={form}
      run={run}
      pending={pending}
      cancelHref={ROUTES.settingsWorkOrders}
      progressLabel={t("wizard.progress")}
      steps={workOrderSteps({ form, options, nameLabel: t("fields.name"), text })}
    />
  );
}
