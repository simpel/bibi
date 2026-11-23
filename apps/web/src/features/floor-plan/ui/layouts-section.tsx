import { getFloorPlan, type LayoutSummaryDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button, FloorDrawing } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { floorPlanRoute, layoutsRoute } from "../layouts-path";
import { storedToDrawing } from "../lib/to-drawing";
import { CreateLayoutButton } from "./create-layout-button";

export type LayoutsSectionProps = {
  locale: Locale;
  itemId: string;
  /** `item:write`: pencils on the layouts and the people limit, Edit floor plan, Create layout. */
  canEdit: boolean;
  /** The people limit's own form, opened from the pencil beside it. */
  limitEditor: ReactNode;
};

type Room = { widthCm: number; depthCm: number; outline: [number, number][] };

type ThumbnailProps = {
  itemId: string;
  room: Room;
  fixed: ReturnType<typeof storedToDrawing>[];
  layout: LayoutSummaryDto;
  capacityLabel: string;
  /** The pencil's label, e.g. "Edit Cabaret"; null without `item:write`. */
  editLabel: string | null;
};

/** One layout as a small drawing of the room; the pencil in its corner opens its editor. */
function LayoutThumbnail({
  itemId,
  room,
  fixed,
  layout,
  capacityLabel,
  editLabel,
}: ThumbnailProps) {
  const href = layoutsRoute({ itemId, layoutId: layout.id });
  return (
    <div className="relative grid w-52 content-start gap-1.5 rounded-lg border bg-card p-2">
      {editLabel ? (
        <Button
          asChild
          variant="outline"
          size="icon"
          aria-label={editLabel}
          className="absolute top-2 right-2 z-10 size-7 bg-background"
        >
          <Link href={href}>
            <PencilIcon className="size-3.5" />
          </Link>
        </Button>
      ) : null}
      <FloorDrawing
        title={layout.name}
        {...room}
        fixed={fixed}
        elements={layout.elements.map((element) => storedToDrawing({ element }))}
        className="aspect-[4/3] w-full"
      />
      <span className="truncate text-sm font-medium">{layout.name}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{capacityLabel}</span>
      {layout.description ? (
        <span className="line-clamp-2 text-xs text-muted-foreground">{layout.description}</span>
      ) : null}
    </div>
  );
}

/**
 * The room's layouts as thumbnails (ADR 0102, 0103): name, capacity and what each suits, with
 * the room's people limit edited in place, a pencil on each layout and Edit floor plan.
 */
export async function LayoutsSection({
  locale,
  itemId,
  canEdit,
  limitEditor,
}: LayoutsSectionProps) {
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
        {canEdit ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={floorPlanRoute({ itemId })}>{t("editFloorPlan")}</Link>
            </Button>
            <CreateLayoutButton
              itemId={itemId}
              layouts={layouts.map(({ id, name }) => ({ id, name }))}
              compact
            />
          </div>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        <EditableFact canEdit={canEdit} editLabel={t("editPeopleLimit")} editor={limitEditor}>
          {maxPeople === null ? t("noPeopleLimit") : t("maxPeople", { count: maxPeople })}
        </EditableFact>
      </p>
      {layouts.length ? (
        <div className="flex flex-wrap gap-3">
          {layouts.map((layout) => (
            <LayoutThumbnail
              key={layout.id}
              {...{ itemId, room, fixed, layout }}
              editLabel={canEdit ? t("editLayout", { name: layout.name }) : null}
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
