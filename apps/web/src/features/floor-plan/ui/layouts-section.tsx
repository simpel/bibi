import { getFloorPlan, type LayoutSummaryDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button, FloorDrawing } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { floorPlanRoute, layoutsRoute } from "../layouts-path";
import { storedToDrawing } from "../lib/to-drawing";

export type LayoutsSectionProps = { locale: Locale; itemId: string };

type Room = { widthCm: number; depthCm: number; outline: [number, number][] };

/** One layout as a small drawing of the room, linking to its editor. */
function LayoutThumbnail({
  itemId,
  room,
  fixed,
  layout,
  capacityLabel,
}: {
  itemId: string;
  room: Room;
  fixed: ReturnType<typeof storedToDrawing>[];
  layout: LayoutSummaryDto;
  capacityLabel: string;
}) {
  return (
    <Link
      href={layoutsRoute({ itemId, layoutId: layout.id })}
      className="group grid w-52 content-start gap-1.5 rounded-lg border bg-card p-2 hover:border-primary"
    >
      <FloorDrawing
        title={layout.name}
        {...room}
        fixed={fixed}
        elements={layout.elements.map((element) => storedToDrawing({ element }))}
        className="aspect-[4/3] w-full"
      />
      <span className="truncate text-sm font-medium group-hover:text-primary">{layout.name}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{capacityLabel}</span>
      {layout.description ? (
        <span className="line-clamp-2 text-xs text-muted-foreground">{layout.description}</span>
      ) : null}
    </Link>
  );
}

/**
 * The room's layouts as thumbnails (ADR 0102, 0103): name, capacity and what each suits, with
 * the room's people limit.
 */
export async function LayoutsSection({ locale, itemId }: LayoutsSectionProps) {
  const t = await getTranslations("floorPlan.section");
  const plan = await runOperation({ operation: getFloorPlan, input: { itemId } });
  if (!plan.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: plan.error, locale })} />;
  const { widthCm, depthCm, outline, maxPeople, layouts } = plan.value;
  const room = { widthCm, depthCm, outline };
  const fixed = plan.value.elements.map((element) => storedToDrawing({ element }));
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("title")}</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={floorPlanRoute({ itemId })}>{t("floorPlan")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={layoutsRoute({ itemId })}>{t("editLayouts")}</Link>
          </Button>
        </div>
      </div>
      {maxPeople === null ? null : (
        <p className="text-sm text-muted-foreground">{t("maxPeople", { count: maxPeople })}</p>
      )}
      {layouts.length ? (
        <div className="flex flex-wrap gap-3">
          {layouts.map((layout) => (
            <LayoutThumbnail
              key={layout.id}
              {...{ itemId, room, fixed, layout }}
              capacityLabel={
                layout.effectiveCapacity === null
                  ? t("noCapacity")
                  : t("capacity", { capacity: layout.effectiveCapacity })
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noLayouts")}</p>
      )}
    </section>
  );
}
