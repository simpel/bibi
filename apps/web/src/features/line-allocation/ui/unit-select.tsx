import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UnitOption } from "./allocation-types";

/** Select value standing for "no unit" (a Select item cannot have an empty value). */
export const NO_UNIT = "none";

export type UnitSelectProps = {
  options: readonly UnitOption[];
  value: string;
  /** An optional demand may stay unfilled. */
  canClear: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
};

/** The pool's units, the prepicked or current one selected. */
export function UnitSelect({ options, value, canClear, disabled, onChange }: UnitSelectProps) {
  const t = useTranslations("lineAllocation");
  return (
    <Select value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger aria-label={t("unit")}>
        <SelectValue placeholder={t("choose")} />
      </SelectTrigger>
      <SelectContent>
        {canClear ? <SelectItem value={NO_UNIT}>{t("unfilled")}</SelectItem> : null}
        {options.map(({ id, name, memberName }) => (
          <SelectItem key={id} value={id}>
            {memberName ? `${name} · ${memberName}` : name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
