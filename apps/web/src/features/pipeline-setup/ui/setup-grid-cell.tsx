import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@okazi/ui";
import { useTranslations } from "next-intl";

/** Select value for "keep the state" (a Select item cannot have an empty value). */
export const KEEP = "__keep__";

export type SetupGridCellProps = {
  phase: string;
  type: string;
  states: readonly { name: string }[];
  /** The state the cell sets, or `KEEP`. */
  value: string;
  onChange: (input: { value: string }) => void;
};

/** One draft grid cell: a dropdown of the type's states or "keep". */
export function SetupGridCell({ phase, type, states, value, onChange }: SetupGridCellProps) {
  const t = useTranslations("phaseGrid");
  return (
    <Select value={value} onValueChange={(next) => onChange({ value: next })}>
      <SelectTrigger aria-label={t("cellLabel", { phase, type })}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={KEEP}>{t("keep")}</SelectItem>
        {states.map((state) => (
          <SelectItem key={state.name} value={state.name}>
            {state.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
