import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import { quoteTotals } from "./line-totals";
import type { LineData } from "./snapshot-lines";

export type WriteLinesInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  quoteId: string;
  lines: readonly LineData[];
};

/** Replaces the quote's lines as a set and stores the new totals (audited on the quote). */
export async function writeLines({ context, quoteId, lines }: WriteLinesInput): Promise<void> {
  await context.db.orderLine.deleteMany({ where: { quoteId } });
  await context.db.orderLine.createMany({
    data: lines.map((line) => ({
      ...line,
      tags: toJson({ value: line.tags }) ?? [],
      quoteId,
      organizationId: context.organizationId,
    })),
  });
  await context.db.quote.update({ where: { id: quoteId }, data: quoteTotals({ lines }) });
}
