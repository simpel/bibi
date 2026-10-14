import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { Control, UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { FieldFormOutput, FieldFormValues } from "./field-form-schema";

export type VocabularyChoice = { id: string; name: string };

type FormControlProps = { control: Control<FieldFormValues, unknown, FieldFormOutput> };

function SourceField({ control }: FormControlProps) {
  const t = useTranslations("fieldDefinition");
  return (
    <FormController
      control={control}
      name="source"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.source")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="list">{t("sources.list")}</SelectItem>
              <SelectItem value="options">{t("sources.options")}</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}

type VocabularyFieldProps = FormControlProps & { vocabularies: VocabularyChoice[] };

function VocabularyField({ control, vocabularies }: VocabularyFieldProps) {
  const t = useTranslations("fieldDefinition");
  return (
    <FormController
      control={control}
      name="vocabularyId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.vocabulary")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("selectList")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {vocabularies.map(({ id, name }) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {vocabularies.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noLists")}</p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export type FieldSourceFieldsProps = {
  form: UseFormReturn<FieldFormValues, unknown, FieldFormOutput>;
  vocabularies: VocabularyChoice[];
};

/** Choice fields: pick a list or enter inline options. */
export function FieldSourceFields({ form, vocabularies }: FieldSourceFieldsProps) {
  const t = useTranslations("fieldDefinition");
  return (
    <>
      <SourceField control={form.control} />
      {form.watch("source") === "list" ? (
        <VocabularyField control={form.control} vocabularies={vocabularies} />
      ) : (
        <TextField form={form} name="options" label={t("fields.options")} multiline rows={5} />
      )}
    </>
  );
}
