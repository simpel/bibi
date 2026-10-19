import type { Result } from "../../errors/result";
import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { quoteTotals } from "./line-totals";
import type { OrderLineDto } from "./order-line-schema";

export type FreezeLinesInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  quoteId: string;
  lines: readonly OrderLineDto[];
};

/**
 * Freezes a DRAFT's derived lines and totals as the
 * quote's snapshot. The draft is claimed first, so a concurrent send of the same quote waits and
 * then gets `CONFLICT` instead of a second snapshot.
 */
export async function freezeLines({
  context,
  quoteId,
  lines,
}: FreezeLinesInput): Promise<Result<true>> {
  const claimed = await context.db.quote.updateMany({
    where: { id: quoteId, quoteStatus: "DRAFT" },
    data: quoteTotals({ lines }),
  });
  if (claimed.count === 0) return conflict({ message: "The quote is no longer a DRAFT" });
  await writeOrderLines({ context, owner: { quoteId }, lines });
  return ok({ value: true });
}

export type WriteOrderLinesInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  /** The snapshot the lines belong to: exactly one quote or invoice (check constraint). */
  owner: { quoteId: string } | { invoiceId: string };
  lines: readonly OrderLineDto[];
};

/** The only writer of `OrderLine` rows (ADR 0052), for a sent quote or a new invoice. */
export async function writeOrderLines({ context, owner, lines }: WriteOrderLinesInput) {
  await context.db.orderLine.createMany({
    data: lines.map(({ id: _id, tags, ...line }) => ({
      ...line,
      ...owner,
      tags: toJson({ value: tags }) ?? [],
      organizationId: context.organizationId,
    })),
  });
}
