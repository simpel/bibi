import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { moveQuote } from "./move-quote";
import type { QuoteDto } from "./schema";
import { loadQuote } from "./to-quote-dto";

type SupersedeInput = {
  context: Pick<OperationContext, "db" | "permissions" | "recordChange">;
  quote: QuoteDto;
};

/**
 * Every other SENT version of the order's quote becomes SUPERSEDED (ADR 0116), still acceptable:
 * when a version is sent, or an older one is set as the current version again.
 */
export async function supersedeOthers({ context, quote }: SupersedeInput): Promise<Result<true>> {
  const others = await context.db.quote.findMany({
    where: { orderId: quote.orderId, quoteStatus: "SENT", id: { not: quote.id } },
    select: { id: true },
  });
  for (const { id } of others) {
    const before = await loadQuote({ context, id });
    if (!before) continue;
    const moved = await moveQuote({ context, before, to: "SUPERSEDED" });
    if (!moved.ok) return moved;
  }
  return ok({ value: true });
}
