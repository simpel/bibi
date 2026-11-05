"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { RunSheetDefinitionForm } from "./run-sheet-definition-form";
import type { RunSheetOptions } from "./run-sheet-options";

export type RunSheetDefinitionUpdateFormProps = {
  runSheet: RunSheetDefinitionDto;
  options: RunSheetOptions;
};

/** The form on its update page; saving (or cancelling) goes back to the list. */
export function RunSheetDefinitionUpdateForm({
  runSheet,
  options,
}: RunSheetDefinitionUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <RunSheetDefinitionForm
        runSheet={runSheet}
        options={options}
        onDone={() => router.push(ROUTES.settingsRunSheets)}
      />
    </div>
  );
}
