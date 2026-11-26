import { Badge, cn } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { FloorLegend } from "./floor-legend";
import { FloorPlanDrawing } from "./floor-plan-drawing";
import { MockupFrame } from "./mockup-frame";

const LANES = [
  { key: "meetings", bar: "bg-chart-1" },
  { key: "food", bar: "bg-chart-2" },
  { key: "restaurant", bar: "bg-chart-4" },
] as const;

/** The hero's one-day view: a meeting, its lunch and the restaurant evening in one window. */
export async function DayMockup() {
  const t = await getTranslations("site.mockup.day");
  return (
    <MockupFrame title={t("title")} className="shadow-xl">
      <div className="grid gap-5 lg:grid-cols-[2fr_3fr] lg:gap-8">
        <div className="grid content-start gap-3">
          <span className="font-serif text-lg">{t("title")}</span>
          <ul className="grid gap-2.5">
            {LANES.map(({ key, bar }) => (
              <li key={key} className="flex gap-3 rounded-lg border bg-background p-3">
                <span className={cn("w-1 shrink-0 rounded-full", bar)} />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="text-xs text-muted-foreground">{t(`${key}.lane`)}</span>
                  <span className="font-medium">{t(`${key}.title`)}</span>
                  <span className="text-muted-foreground tabular-nums">{t(`${key}.meta`)}</span>
                </div>
                <Badge variant="secondary" className="self-start">
                  {t(`${key}.status`)}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid content-start gap-3 rounded-lg border bg-background p-3">
          <span className="text-xs text-muted-foreground">{t("floor")}</span>
          <FloorPlanDrawing />
          <FloorLegend />
        </div>
      </div>
    </MockupFrame>
  );
}
