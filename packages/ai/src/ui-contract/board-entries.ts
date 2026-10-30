import { BoardPhaseSchema, BoardSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a board column as tool results carry it (dates = ISO strings). */
export const BoardPhaseWireSchema = BoardPhaseSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** JSON form of a board with its columns (ADR 0067). */
export const BoardWireSchema = BoardSchema.extend({
  phases: z.array(BoardPhaseWireSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const BoardListWireSchema = z.object({
  items: z.array(BoardWireSchema),
  nextCursor: z.string().nullable(),
});

export type BoardWire = z.infer<typeof BoardWireSchema>;
export type BoardPhaseWire = z.infer<typeof BoardPhaseWireSchema>;

/** Props of the board components, merged into `ToolUiProps`. */
export type BoardUiProps = {
  "board-list": { items: BoardWire[]; nextCursor: string | null };
  "board-card": { board: BoardWire };
  "board-phase-card": { phase: BoardPhaseWire };
};

const boardList = uiEntry({
  component: "board-list",
  schema: BoardListWireSchema,
  toProps: ({ value }) => value,
});
const boardCard = uiEntry({
  component: "board-card",
  schema: BoardWireSchema,
  toProps: ({ value }) => ({ board: value }),
});
const phaseCard = uiEntry({
  component: "board-phase-card",
  schema: BoardPhaseWireSchema,
  toProps: ({ value }) => ({ phase: value }),
});

/** Tool → component for boards and their columns (ADR 0067). */
export const BOARD_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  board_list: boardList,
  board_get: boardCard,
  board_create: boardCard,
  board_update: boardCard,
  board_reorder: boardList,
  board_archive: boardCard,
  boardPhase_create: phaseCard,
  boardPhase_update: phaseCard,
  boardPhase_archive: phaseCard,
  boardPhase_reorder: boardCard,
  boardPhase_moveStatus: boardCard,
};
