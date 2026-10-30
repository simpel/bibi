import type { ReactNode } from "react";

/** A board column in customize mode: a phase that groups statuses (only statuses have a colour). */
export type KanbanPhaseData = {
  id: string;
  title: string;
  /** The chips in this column, in display order. */
  statusIds: readonly string[];
};

/** A chip that can move between columns and the unphased column. */
export type KanbanStatusChipData = {
  id: string;
  title: string;
  color?: string;
  /** Tickets in this status, when known; shown as a small count. */
  count?: number;
};

/** A chip move: `toPhaseId` null = into the unphased column (off the board). */
export type KanbanStatusMove = {
  statusId: string;
  fromPhaseId: string | null;
  toPhaseId: string | null;
};

/** Localised texts for customize mode; the caller passes them through next-intl. */
export type KanbanCustomizeLabels = {
  dragInstructions: string;
  /** Heading of the far-left column of statuses that are on no column of this board. */
  unphased: string;
  unphasedEmpty: string;
  emptyPhase: string;
  /** Accessible name of a column's drag handle. */
  phaseHandle: (phase: string) => string;
  /** Accessible text of a chip's ticket count. */
  count: (count: number) => string;
  pickedUp: (item: string) => string;
  movedOver: (item: string, target: string) => string;
  dropped: (item: string, target: string) => string;
  cancelled: (item: string) => string;
};

/** Slots the app fills: forms, menus and the column front. */
export type KanbanCustomizeSlots = {
  /** The column's face before it flips (usually the read-only column). */
  renderFront: (input: { phase: KanbanPhaseData }) => ReactNode;
  /** Header content on the back next to the drag handle: name, colour, column menu. */
  renderPhaseHeader: (input: { phase: KanbanPhaseData }) => ReactNode;
  /** Below the chips, e.g. "+ Add status". */
  renderPhaseFooter?: (input: { phase: KanbanPhaseData }) => ReactNode;
  /** A chip's menu (edit, transitions, archive). */
  renderChipMenu?: (input: { status: KanbanStatusChipData; phaseId: string | null }) => ReactNode;
  /** Between columns (`position` = index the new column gets) and after the last. */
  renderAddColumn?: (input: { position: number }) => ReactNode;
  /** Below the unphased column's chips, e.g. "+ Add status". */
  unphasedFooter?: ReactNode;
};
