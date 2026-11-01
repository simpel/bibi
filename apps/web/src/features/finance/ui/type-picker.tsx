import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ItemTypeOption } from "../lib/accounting-form";

export type TypePickerProps = {
  choices: ItemTypeOption[];
  value: string;
  onChange: (id: string) => void;
};

/** The item type a new revenue account is for. */
export function TypePicker({ choices, value, onChange }: TypePickerProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  return (
    <div className="grid gap-2">
      <Label htmlFor="account-type">{t("pickType")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="account-type">
          <SelectValue placeholder={common("select")} />
        </SelectTrigger>
        <SelectContent>
          {choices.map(({ id, name }) => (
            <SelectItem key={id} value={id}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
