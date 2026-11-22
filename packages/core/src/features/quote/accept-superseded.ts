import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { loadOrderContent } from "../order-version/content";
import { loadVersion, loadVersionLines } from "../order-version/load-versions";
import { restoreVersion } from "../order-version/restore";
import { moveQuote } from "./move-quote";
import type { QuoteDto } from "./schema";
import { loadQuote } from "./to-quote-dto";

type Input = { context: OperationContext; quote: QuoteDto };

/** The order back to the version the quote was sent as, unless it already is (ADR 0116). */
async function restoreQuoteVersion({ context, quote }: Input): Promise<Result<true>> {
  if (!quote.versionId) return ok({ value: true });
  const row = await loadVersion({ context, id: quote.versionId });
  const now = await loadOrderContent({ context, orderId: quote.orderId });
  if (!row || !now || row.contentHash === now.hash) return ok({ value: true });
  const lines = (await loadVersionLines({ context, versionIds: [row.id] })).get(row.id) ?? [];
  const restored = await restoreVersion({ context, version: { ...row, lines } });
  return restored.ok ? ok({ value: true }) : restored;
}

/**
 * The customer chose an older version (ADR 0116): a SUPERSEDED quote is accepted only while it is
 * valid; the order is restored to its version and the newer SENT quote is declined. Nothing to do
 * for a SENT quote.
 */
export async function prepareSupersededAccept({ context, quote }: Input): Promise<Result<true>> {
  if (quote.quoteStatus !== "SUPERSEDED") return ok({ value: true });
  if (!quote.validUntil || quote.validUntil <= nowOf({ context })) {
    return conflict({ message: "The quote is no longer valid, so it cannot be accepted" });
  }
  const restored = await restoreQuoteVersion({ context, quote });
  if (!restored.ok) return restored;
  const newer = await context.db.quote.findMany({
    where: { orderId: quote.orderId, quoteStatus: "SENT", id: { not: quote.id } },
    select: { id: true },
  });
  for (const { id } of newer) {
    const before = await loadQuote({ context, id });
    if (!before) continue;
    const declined = await moveQuote({ context, before, to: "DECLINED" });
    if (!declined.ok) return declined;
  }
  return ok({ value: true });
}
