import { cn, FloorDrawing } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { floorTables, ROOM, ROOM_OUTLINE } from "./floor-plan-tables";

export type FloorPlanDrawingProps = { className?: string };

/** The mock dining room drawn with the app's own floor drawing, tables toned by tonight's state. */
export async function FloorPlanDrawing({ className }: FloorPlanDrawingProps) {
  const t = await getTranslations("site.mockup.floor");
  return (
    <FloorDrawing
      widthCm={ROOM.widthCm}
      depthCm={ROOM.depthCm}
      outline={ROOM_OUTLINE}
      elements={floorTables({ name: (label) => t("table", { label }) })}
      title={t("title")}
      className={cn("h-auto w-full", className)}
    />
  );
}
