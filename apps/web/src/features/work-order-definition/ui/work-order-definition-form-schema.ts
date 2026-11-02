import type { WorkOrderDefinitionDto } from "@bibi/core";
import { WorkOrderDefinitionCreateInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the work order form. */
export type WorkOrderDefinitionFormValues = {
  name: string;
  entityTypeIds: string[];
  fieldIds: string[];
  vocabularyIds: string[];
  responsibilityId: string;
};

export type WorkOrderDefinitionFormInput = { values: WorkOrderDefinitionFormValues };

/** Form values → the shape core's `workOrderDefinition.create` input schema validates. */
export function workOrderDefinitionFormToInput({ values }: WorkOrderDefinitionFormInput) {
  return { ...values, name: values.name.trim() };
}

export const workOrderDefinitionFormSchema = formSchema({
  schema: WorkOrderDefinitionCreateInputSchema,
  toInput: workOrderDefinitionFormToInput,
});

export type WorkOrderDefinitionDefaultsInput = { workOrder?: WorkOrderDefinitionDto | undefined };

export function workOrderDefinitionFormDefaults({
  workOrder,
}: WorkOrderDefinitionDefaultsInput): WorkOrderDefinitionFormValues {
  return {
    name: workOrder?.name ?? "",
    entityTypeIds: workOrder?.entityTypeIds ?? [],
    fieldIds: workOrder?.fieldIds ?? [],
    vocabularyIds: workOrder?.vocabularyIds ?? [],
    responsibilityId: workOrder?.responsibilityId ?? "",
  };
}
