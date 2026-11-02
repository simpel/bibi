import { getWorkOrderDefinition } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadWorkOrderOptions } from "../load-work-order-options";
import { WorkOrderDefinitionUpdateForm } from "./work-order-definition-update-form";

export type WorkOrderDefinitionUpdateProps = { locale: Locale; id: string };

/** `/settings/work-orders/[id]/update`: edit on a page of its own. */
export async function WorkOrderDefinitionUpdate({ locale, id }: WorkOrderDefinitionUpdateProps) {
  const t = await getTranslations("workOrderDefinition");
  const [workOrder, options] = await Promise.all([
    runOperation({ operation: getWorkOrderDefinition, input: { id } }),
    loadWorkOrderOptions(),
  ]);
  if (!workOrder.ok)
    return <ErrorState errorKey={handleLoadError({ error: workOrder.error, locale })} />;
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsWorkOrders}
      title={t("edit")}
      description={t("editDescription")}
    >
      <WorkOrderDefinitionUpdateForm workOrder={workOrder.value} options={options.value} />
    </FormPageShell>
  );
}
