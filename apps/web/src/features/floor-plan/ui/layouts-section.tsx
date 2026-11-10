import { getFloorPlan, type LayoutSummaryDto, listSetups } from "@bibi/core";
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
  seatsLabel,
}: {
  itemId: string;
  room: Room;
  fixed: ReturnType<typeof storedToDrawing>[];
  layout: LayoutSummaryDto;
  seatsLabel: string;
}) {
  return (
    <Link
      href={layoutsRoute({ itemId, layoutId: layout.id })}
      className="group grid w-44 gap-1.5 rounded-lg border bg-card p-2 hover:border-primary"
    >
      <FloorDrawing
        title={layout.name}
        {...room}
        fixed={fixed}
        elements={layout.elements.map((element) => storedToDrawing({ element }))}
        className="aspect-[4/3] w-full"
      />
      <span className="truncate text-sm font-medium group-hover:text-primary">{layout.name}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{seatsLabel}</span>
    </Link>
  );
}

/**
 * The item's layouts per setup as thumbnails (ADR 0102), with the setup's capacity: a typed one,
 * else its largest layout's seats.
 */
export async function LayoutsSection({ locale, itemId }: LayoutsSectionProps) {
  const t = await getTranslations("floorPlan.section");
  const [plan, setups] = await Promise.all([
    runOperation({ operation: getFloorPlan, input: { itemId } }),
    runOperation({ operation: listSetups, input: { limit: 100 } }),
  ]);
  if (!plan.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: plan.error, locale })} />;
  const names = new Map(setups.ok ? setups.value.items.map((s) => [s.id, s.name]) : []);
  const { widthCm, depthCm, outline } = plan.value;
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
      {plan.value.setups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noSetups")}</p>
      ) : null}
      {plan.value.setups.map((setup) => {
        const layouts = plan.value.layouts.filter((layout) => layout.setupId === setup.setupId);
        return (
          <div key={setup.setupId} className="grid gap-2">
            <h3 className="text-sm font-semibold">
              {names.get(setup.setupId) ?? "–"}
              <span className="ml-2 font-normal text-muted-foreground">
                {setup.effectiveCapacity === null
                  ? t("noCapacity")
                  : t(setup.capacitySource === "MANUAL" ? "capacityTyped" : "capacityLargest", {
                      capacity: setup.effectiveCapacity,
                    })}
              </span>
            </h3>
            {layouts.length ? (
              <div className="flex flex-wrap gap-3">
                {layouts.map((layout) => (
                  <LayoutThumbnail
                    key={layout.id}
                    {...{ itemId, room, fixed, layout }}
                    seatsLabel={t("seats", { count: layout.seatCount })}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noLayouts")}</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
