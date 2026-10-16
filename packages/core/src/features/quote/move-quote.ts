import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import type { QuoteDto, QuoteStatus } from "./schema";
import { loadQuote } from "./to-quote-dto";
import { checkQuoteTransition } from "./transitions";

export type MoveQuoteInput = {
  context: Pick<OperationContext, "db" | "recordChange">;
  before: QuoteDto;
  to: QuoteStatus;
};

/**
 * The one place a quote's status changes: checks the state machine (`CONFLICT` otherwise),
 * stamps `statusChangedAt` and records the change in the audit log.
 */
export async function moveQuote({
  context,
  before,
  to,
}: MoveQuoteInput): Promise<Result<QuoteDto>> {
  const allowed = checkQuoteTransition({ from: before.quoteStatus, to });
  if (!allowed.ok) return allowed;
  await context.db.quote.update({
    where: { id: before.id },
    data: { quoteStatus: to, statusChangedAt: new Date() },
  });
  const quote = await loadQuote({ context, id: before.id });
  if (!quote) return notFound({ entity: "Quote" });
  context.recordChange({ entityType: "quote", entityId: before.id, before, after: quote });
  return ok({ value: quote });
}
