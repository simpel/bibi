import type { ProgramItemDto } from "@okazi/core";
import { ColorSwatch } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ProgramFormData } from "./program-form-data";

export type StateOfInput = { item: ProgramItemDto; data: ProgramFormData };

/** The line's state among the loaded states, if it has one. */
export const stateOf = ({ item, data }: StateOfInput) =>
  data.states.find((state) => state.id === item.stateId);

export type LineStateCellProps = { programItem: ProgramItemDto; data: ProgramFormData };

/** The line's state with its color, marked when it is overridden (phase moves skip it). */
export function LineStateCell({ programItem, data }: LineStateCellProps) {
  const t = useTranslations("programItem");
  const state = stateOf({ item: programItem, data });
  if (!state) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <ColorSwatch color={state.color} />
      {state.name}
      {programItem.stateOverridden ? (
        <span className="text-xs text-muted-foreground">{t("overridden")}</span>
      ) : null}
    </span>
  );
}
