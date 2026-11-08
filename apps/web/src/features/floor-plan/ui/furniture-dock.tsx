import type { FloorElementKindDto } from "@bibi/core/schemas";
import { Button, FloorPiece, Tooltip, TooltipContent, TooltipTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type KindMap, NO_OVERRIDES } from "../lib/draft";
import { draftToDrawing } from "../lib/to-drawing";

/** The `dataTransfer` type a dragged kind travels as. */
export const KIND_MIME = "application/x-bibi-floor-kind";

function KindIcon({ kind, kinds }: { kind: FloorElementKindDto; kinds: KindMap }) {
  const element = {
    ...NO_OVERRIDES,
    key: kind.id,
    kindId: kind.id,
    xCm: 0,
    yCm: 0,
    rotationDeg: 0,
    label: null,
  };
  const drawn = draftToDrawing({ element, kinds, tone: "default", nameOf: () => kind.name });
  if (!drawn) return null;
  const chairs = drawn.seats.length > 0 ? 110 : 0;
  const span = Math.max(drawn.widthCm + chairs, drawn.depthCm + chairs, 80);
  return (
    <svg viewBox={`${-span / 2} ${-span / 2} ${span} ${span}`} className="size-9" aria-hidden>
      <FloorPiece element={drawn} />
    </svg>
  );
}

export type FurnitureDockProps = {
  kinds: readonly FloorElementKindDto[];
  kindMap: KindMap;
  onAdd: (input: { kindId: string }) => void;
};

/** The library as icons on the drawing: click drops a piece in the middle, drag places it. */
export function FurnitureDock({ kinds, kindMap, onAdd }: FurnitureDockProps) {
  const t = useTranslations("floorPlan");
  return (
    <nav
      aria-label={t("dock")}
      className="absolute top-3 left-3 grid max-h-[calc(100%-1.5rem)] gap-0.5 overflow-y-auto rounded-xl border bg-card p-1 shadow-sm max-sm:top-auto max-sm:bottom-3 max-sm:left-1/2 max-sm:max-w-[calc(100%-1.5rem)] max-sm:-translate-x-1/2 max-sm:grid-flow-col max-sm:overflow-x-auto"
    >
      {kinds.map((kind) => (
        <Tooltip key={kind.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-grab"
              aria-label={t("add", { name: kind.name })}
              draggable
              onDragStart={(event) => event.dataTransfer.setData(KIND_MIME, kind.id)}
              onClick={() => onAdd({ kindId: kind.id })}
            >
              <KindIcon kind={kind} kinds={kindMap} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{kind.name}</TooltipContent>
        </Tooltip>
      ))}
    </nav>
  );
}
