import type { WorkOrderDefinitionCreateInput, WorkOrderDefinitionDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type WorkOrderDefinitionFormValues,
  workOrderDefinitionFormDefaults,
  workOrderDefinitionFormSchema,
} from "./work-order-definition-form-schema";

export type UseWorkOrderDefinitionFormInput = { workOrder?: WorkOrderDefinitionDto | undefined };

/** react-hook-form wired to core's work order definition schema with localized messages. */
export function useWorkOrderDefinitionForm({ workOrder }: UseWorkOrderDefinitionFormInput) {
  return useForm<WorkOrderDefinitionFormValues, unknown, WorkOrderDefinitionCreateInput>({
    resolver: zodResolver(workOrderDefinitionFormSchema, useZodMessages()),
    defaultValues: workOrderDefinitionFormDefaults({ workOrder }),
  });
}
