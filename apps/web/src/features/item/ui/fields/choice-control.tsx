import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ChoiceControlProps } from "./control-props";

/** CHOICE field: one value from a list or own options. */
export function ChoiceControl({ value, onChange, choices, ...aria }: ChoiceControlProps<string>) {
  const t = useTranslations("item");
  return (
    <Select value={value === "" ? undefined : value} onValueChange={onChange}>
      <SelectTrigger {...aria}>
        <SelectValue placeholder={t("select")} />
      </SelectTrigger>
      <SelectContent>
        {choices.map(({ value: choice, label }) => (
          <SelectItem key={choice} value={choice}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
