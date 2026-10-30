import type { ReactNode } from "react";

export type * from "./kanban-customize-types";

/** A drop zone inside a column (e.g. one ticket status of a board phase). */
export type KanbanZoneData = {
  id: string;
  title: string;
  color?: string;
};

export type KanbanColumnData = {
  id: string;
  title: string;
  /**
   * The column's drop zones. With two or more, a dragged card picks one: each zone shows as its
   * own target while dragging. With one, the whole column drops into it.
   */
  zones?: readonly KanbanZoneData[];
};

export type KanbanCardData = {
  id: string;
  columnId: string;
  /** The zone the card sits in, when its column has zones. */
  zoneId?: string;
  /** Plain text for screen reader announcements. */
  title: string;
};

export type KanbanMove = {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  /** The zone the card was dropped on; set whenever the target column has zones. */
  toZoneId?: string;
};

export type KanbanCanDrop = (move: KanbanMove) => boolean;

/** Localised texts; the caller passes them through next-intl. */
export type KanbanLabels = {
  dragInstructions: string;
  emptyColumn: string;
  pickedUp: (card: string) => string;
  movedOver: (card: string, column: string) => string;
  dropped: (card: string, column: string) => string;
  cancelled: (card: string) => string;
};

export type KanbanRenderCard<TCard extends KanbanCardData> = (card: TCard) => ReactNode;
