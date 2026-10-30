import { useDroppable } from "@dnd-kit/core";
import { cn } from "../../lib/cn";
import { zoneDropId } from "./kanban-targets";
import type { KanbanZoneData } from "./kanban-types";

export type KanbanZoneProps = {
  zone: KanbanZoneData;
  /** Whether the dragged card may land in this zone. */
  accepting: boolean;
};

/** One drop zone of a multi-zone column, shown only while a card is dragged. */
export function KanbanZone({ zone, accepting }: KanbanZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: zoneDropId({ zoneId: zone.id }),
    disabled: !accepting,
  });
  return (
    <div
      ref={setNodeRef}
      data-slot="kanban-zone"
      data-accepting={accepting || undefined}
      className={cn(
        "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed",
        "bg-background/90 px-2 text-center text-xs font-medium transition-colors",
        accepting
          ? "border-border text-foreground"
          : "border-transparent text-muted-foreground opacity-60",
        isOver && accepting && "border-ring bg-accent",
      )}
    >
      {zone.color ? (
        <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: zone.color }} />
      ) : null}
      <span className="truncate">{zone.title}</span>
    </div>
  );
}

export type KanbanZonesProps = { zones: readonly { zone: KanbanZoneData; accepting: boolean }[] };

/** The zones laid over a column's cards while a card is dragged. */
export function KanbanZones({ zones }: KanbanZonesProps) {
  return (
    <div data-slot="kanban-zones" className="absolute inset-0 flex min-h-24 flex-col gap-2">
      {zones.map(({ zone, accepting }) => (
        <KanbanZone key={zone.id} zone={zone} accepting={accepting} />
      ))}
    </div>
  );
}
