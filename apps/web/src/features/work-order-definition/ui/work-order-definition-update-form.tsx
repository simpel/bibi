"use client";

import type { WorkOrderDefinitionDto } from "@bibi/core";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { WorkOrderDefinitionForm } from "./work-order-definition-form";
import type { WorkOrderOptions } from "./work-order-options";

export type WorkOrderDefinitionUpdateFormProps = {
  workOrder: WorkOrderDefinitionDto;
  options: WorkOrderOptions;
};

/** The form on its update page; saving (or cancelling) goes back to the list. */
export function WorkOrderDefinitionUpdateForm({
  workOrder,
  options,
}: WorkOrderDefinitionUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <WorkOrderDefinitionForm
        workOrder={workOrder}
        options={options}
        onDone={() => router.push(ROUTES.settingsWorkOrders)}
      />
    </div>
  );
}
