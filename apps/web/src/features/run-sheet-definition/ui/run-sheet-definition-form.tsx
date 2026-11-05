import type { RunSheetDefinitionCreateInput, RunSheetDefinitionDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createRunSheetDefinitionAction, updateRunSheetDefinitionAction } from "../actions";
import { RunSheetDefinitionFormFields } from "./run-sheet-definition-form-fields";
import type { RunSheetOptions } from "./run-sheet-options";
import { useRunSheetDefinitionForm } from "./use-run-sheet-definition-form";

export type RunSheetDefinitionFormProps = {
  runSheet?: RunSheetDefinitionDto | undefined;
  options: RunSheetOptions;
  onDone: () => void;
};

type SaveInput = {
  runSheet: RunSheetDefinitionDto | undefined;
  values: RunSheetDefinitionCreateInput;
};

const save = ({ runSheet, values }: SaveInput) =>
  runSheet
    ? updateRunSheetDefinitionAction({ input: { id: runSheet.id, ...values } })
    : createRunSheetDefinitionAction({ input: values });

/** Create (no `runSheet`) or edit form: name, included types, fields and lists, receiving role. */
export function RunSheetDefinitionForm({ runSheet, options, onDone }: RunSheetDefinitionFormProps) {
  const t = useTranslations("runSheetDefinition");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useRunSheetDefinitionForm({ runSheet });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ runSheet, values }),
    messages: { pending: t("saving"), success: t(runSheet ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <RunSheetDefinitionFormFields form={form} options={options} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
