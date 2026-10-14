import type { FieldDefinitionDto } from "@okazi/core";
import { isChoiceKind } from "@okazi/core/schemas";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import { FieldKindField } from "./field-kind-field";
import { FieldSourceFields, type VocabularyChoice } from "./field-source-fields";
import { useFieldForm } from "./use-field-form";

export type FieldFormProps = {
  entityTypeId: string;
  /** Present = edit mode, absent = create mode. */
  field?: FieldDefinitionDto | undefined;
  vocabularies: VocabularyChoice[];
  onDone: () => void;
};

/** Create or edit one field of a type; the kind decides whether a list or options are asked for. */
export function FieldForm({ vocabularies, onDone, ...rest }: FieldFormProps) {
  const t = useTranslations("fieldDefinition");
  const common = useTranslations("common");
  const { form, submit, pending } = useFieldForm({ onDone, ...rest });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <FieldKindField control={form.control} />
        {isChoiceKind({ kind: form.watch("kind") }) ? (
          <FieldSourceFields form={form} vocabularies={vocabularies} />
        ) : null}
        <CheckField form={form} name="required" label={t("fields.required")} />
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
