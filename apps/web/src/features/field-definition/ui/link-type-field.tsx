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
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { FieldFormOutput, FieldFormValues } from "./field-form-schema";
import type { VocabularyChoice } from "./field-source-fields";

export type LinkTypeFieldProps = {
  control: Control<FieldFormValues, unknown, FieldFormOutput>;
  linkTypes: VocabularyChoice[];
};

/** LINK fields: the type whose records the field points to. */
export function LinkTypeField({ control, linkTypes }: LinkTypeFieldProps) {
  const t = useTranslations("fieldDefinition");
  return (
    <FormController
      control={control}
      name="linkTypeId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.linkType")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("selectLinkType")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {linkTypes.map(({ id, name }) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
