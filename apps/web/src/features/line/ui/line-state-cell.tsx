import type { LineDto } from "@bibi/core";
import { ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ProgramFormData } from "./program-form-data";

export type StateOfInput = { item: LineDto; data: ProgramFormData };

/** The line's state among the loaded states, if it has one. */
export const stateOf = ({ item, data }: StateOfInput) =>
  data.states.find((state) => state.id === item.stateId);

export type LineStateCellProps = { line: LineDto; data: ProgramFormData };

/** The line's state with its color, marked when it is overridden (phase moves skip it). */
export function LineStateCell({ line, data }: LineStateCellProps) {
  const t = useTranslations("line");
  const state = stateOf({ item: line, data });
  if (!state) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <ColorSwatch color={state.color} />
      {state.name}
      {line.stateOverridden ? (
        <span className="text-xs text-muted-foreground">{t("overridden")}</span>
      ) : null}
    </span>
  );
}
