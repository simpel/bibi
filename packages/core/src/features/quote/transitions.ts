import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import type { QuoteStatus } from "./schema";

/**
 * The quote's fixed state machine (ADR 0022): `DRAFT → SENT → ACCEPTED`, `DECLINED` or
 * `EXPIRED`. Only a DRAFT can be edited; the final statuses never move. Each move has its own
 * command.
 */
export const QUOTE_TRANSITIONS: Readonly<Record<QuoteStatus, readonly QuoteStatus[]>> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "DECLINED", "EXPIRED"],
  ACCEPTED: [],
  DECLINED: [],
  EXPIRED: [],
};

export type QuoteTransition = { from: QuoteStatus; to: QuoteStatus };

/** Whether the quote's state machine allows the move. */
export const canQuoteTransition = ({ from, to }: QuoteTransition): boolean =>
  QUOTE_TRANSITIONS[from].includes(to);

/** `CONFLICT` unless the quote's state machine allows the move. */
export function checkQuoteTransition({ from, to }: QuoteTransition): Result<true> {
  if (canQuoteTransition({ from, to })) return ok({ value: true });
  return conflict({ message: `A quote cannot move from ${from} to ${to}` });
}
