import type { RunSheetDefinitionCreateInput, RunSheetDefinitionDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type RunSheetDefinitionFormValues,
  runSheetDefinitionFormDefaults,
  runSheetDefinitionFormSchema,
} from "./run-sheet-definition-form-schema";

export type UseRunSheetDefinitionFormInput = { runSheet?: RunSheetDefinitionDto | undefined };

/** react-hook-form wired to core's run sheet definition schema with localized messages. */
export function useRunSheetDefinitionForm({ runSheet }: UseRunSheetDefinitionFormInput) {
  return useForm<RunSheetDefinitionFormValues, unknown, RunSheetDefinitionCreateInput>({
    resolver: zodResolver(runSheetDefinitionFormSchema, useZodMessages()),
    defaultValues: runSheetDefinitionFormDefaults({ runSheet }),
  });
}
