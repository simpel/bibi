import type { SheetDefinitionCreateInput, SheetDefinitionDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type SheetDefinitionFormValues,
  sheetDefinitionFormDefaults,
  sheetDefinitionFormSchema,
} from "./sheet-definition-form-schema";

export type UseSheetDefinitionFormInput = { sheet?: SheetDefinitionDto | undefined };

/** react-hook-form wired to core's sheet definition schema with localized messages. */
export function useSheetDefinitionForm({ sheet }: UseSheetDefinitionFormInput) {
  return useForm<SheetDefinitionFormValues, unknown, SheetDefinitionCreateInput>({
    resolver: zodResolver(sheetDefinitionFormSchema, useZodMessages()),
    defaultValues: sheetDefinitionFormDefaults({ sheet }),
  });
}
