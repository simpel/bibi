import { Badge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { FloorLegend } from "./floor-legend";
import { FloorPlanDrawing } from "./floor-plan-drawing";
import { MockupFrame } from "./mockup-frame";

const ARRIVALS = ["arrival1", "arrival2", "arrival3"] as const;

/** Staff's evening view: the floor with tonight's tables and who arrives next. */
export async function FloorPlanMockup() {
  const t = await getTranslations("site.mockup.floor");
  return (
    <MockupFrame title={t("title")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-serif text-lg">{t("title")}</span>
        <Badge variant="secondary" className="tabular-nums">
          {t("covers")}
        </Badge>
      </div>
      <FloorPlanDrawing />
      <FloorLegend />
      <div className="grid gap-2 border-t pt-3">
        <span className="text-xs text-muted-foreground">{t("next")}</span>
        <ul className="grid gap-1.5">
          {ARRIVALS.map((key) => (
            <li key={key} className="tabular-nums">
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </MockupFrame>
  );
}
