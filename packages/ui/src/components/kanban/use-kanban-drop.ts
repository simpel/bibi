import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";
import { hasZones, isSameTarget, type KanbanTarget, resolveTarget } from "./kanban-targets";
import type {
  KanbanCanDrop,
  KanbanCardData,
  KanbanColumnData,
  KanbanMove,
  KanbanZoneData,
} from "./kanban-types";

export type UseKanbanDropInput<TCard extends KanbanCardData> = {
  cards: readonly TCard[];
  columns: readonly KanbanColumnData[];
  canDrop: KanbanCanDrop;
  onMove: (move: KanbanMove) => void;
};

export type KanbanColumnDropState = {
  accepting: boolean | undefined;
  zones: { zone: KanbanZoneData; accepting: boolean }[];
};

const toMove = ({ card, target }: { card: KanbanCardData; target: KanbanTarget }): KanbanMove => ({
  cardId: card.id,
  fromColumnId: card.columnId,
  toColumnId: target.columnId,
  ...(target.zoneId === undefined ? {} : { toZoneId: target.zoneId }),
});

/** The dragged card and which columns and zones accept it; a valid drop runs `onMove`. */
export function useKanbanDrop<TCard extends KanbanCardData>({
  cards,
  columns,
  canDrop,
  onMove,
}: UseKanbanDropInput<TCard>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = cards.find((c) => c.id === activeId);

  const accepts = ({ target }: { target: KanbanTarget }): boolean =>
    !!active &&
    !isSameTarget({ card: active, target }) &&
    canDrop(toMove({ card: active, target }));

  const columnState = ({ column }: { column: KanbanColumnData }): KanbanColumnDropState => {
    if (!active) return { accepting: undefined, zones: [] };
    if (hasZones({ column })) {
      const zones = (column.zones ?? []).map((zone) => ({
        zone,
        accepting: accepts({ target: { columnId: column.id, zoneId: zone.id } }),
      }));
      return { accepting: zones.some((zone) => zone.accepting), zones };
    }
    const target = resolveTarget({ id: column.id, columns }) ?? { columnId: column.id };
    return { accepting: accepts({ target }), zones: [] };
  };

  const handlers = {
    onDragStart: ({ active: dragged }: DragStartEvent) => setActiveId(String(dragged.id)),
    onDragEnd: ({ over }: DragEndEvent) => {
      setActiveId(null);
      const target = over ? resolveTarget({ id: String(over.id), columns }) : null;
      if (active && target && accepts({ target })) onMove(toMove({ card: active, target }));
    },
    onDragCancel: () => setActiveId(null),
  };
  return { active, columnState, handlers };
}
