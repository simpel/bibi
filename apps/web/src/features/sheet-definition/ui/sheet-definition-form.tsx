import type { SheetDefinitionCreateInput, SheetDefinitionDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useFormAction } from "@/lib/use-form-action";
import { createSheetDefinitionAction, updateSheetDefinitionAction } from "../actions";
import { SheetDefinitionFormFields } from "./sheet-definition-form-fields";
import type { SheetOptions } from "./sheet-options";
import { useSheetDefinitionForm } from "./use-sheet-definition-form";

export type SheetDefinitionFormProps = {
  sheet?: SheetDefinitionDto | undefined;
  options: SheetOptions;
  onDone: () => void;
};

type SaveInput = { sheet: SheetDefinitionDto | undefined; values: SheetDefinitionCreateInput };

const save = ({ sheet, values }: SaveInput) =>
  sheet
    ? updateSheetDefinitionAction({ input: { id: sheet.id, ...values } })
    : createSheetDefinitionAction({ input: values });

/** Create (no `sheet`) or edit form: name, included types, fields and lists, receiving role. */
export function SheetDefinitionForm({ sheet, options, onDone }: SheetDefinitionFormProps) {
  const t = useTranslations("sheetDefinition");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useSheetDefinitionForm({ sheet });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ sheet, values }),
    messages: { pending: t("saving"), success: t(sheet ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <SheetDefinitionFormFields form={form} options={options} />
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
