import { getTranslations } from "next-intl/server";
import type { LegendState } from "../calendar-legend";
import { stateStyle } from "./state-style";

export type CalendarLegendProps = { states: LegendState[] };

/** The organization's own states: swatch (hatched or solid) plus the name and hold kind in text. */
export async function CalendarLegend({ states }: CalendarLegendProps) {
  if (states.length === 0) return null;
  const t = await getTranslations("calendar");
  return (
    <ul aria-label={t("legend")} className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {states.map((state) => (
        <li key={state.id} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 rounded-sm border"
            style={stateStyle({ color: state.color, soft: state.soft })}
          />
          <span className="font-medium">{state.name}</span>
          <span className="text-muted-foreground">
            ({state.soft ? t("softHold") : t("hardHold")})
          </span>
        </li>
      ))}
    </ul>
  );
}
