import type { ReactNode } from "react";

export type KanbanColumnData = {
  id: string;
  title: string;
  /** Optional accent (a CSS colour or token reference) shown as a dot before the title. */
  color?: string;
};

export type KanbanCardData = {
  id: string;
  columnId: string;
  /** Plain text for screen reader announcements. */
  title: string;
};

export type KanbanMove = { cardId: string; fromColumnId: string; toColumnId: string };

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
