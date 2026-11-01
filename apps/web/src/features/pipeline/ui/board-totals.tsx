"use client";

import type { PipelineBoard } from "@bibi/core";
import { PhaseValue } from "./phase-value";

export type BoardTotalsProps = { board: PipelineBoard };

/** The whole board's agreed and estimated value, next to the board switcher. */
export function BoardTotals({ board }: BoardTotalsProps) {
  return <PhaseValue cards={board.cards} currency={board.currency} />;
}
