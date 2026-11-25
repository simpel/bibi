import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import type { QuoteStatus } from "./schema";

/**
 * The quote's fixed state machine (ADR 0022): `DRAFT → SENT → ACCEPTED`, `DECLINED` or
 * `EXPIRED`; a SENT quote becomes SUPERSEDED when a newer version is sent, and stays acceptable
 * (ADR 0116), and is SENT again when staff set it as the current version (`quote.reopen`). Only a DRAFT can be edited; the final statuses never move. Each move has its own
 * command.
 */
export const QUOTE_TRANSITIONS: Readonly<Record<QuoteStatus, readonly QuoteStatus[]>> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "DECLINED", "EXPIRED", "SUPERSEDED"],
  ACCEPTED: [],
  DECLINED: [],
  EXPIRED: [],
  SUPERSEDED: ["ACCEPTED", "DECLINED", "EXPIRED", "SENT"],
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
