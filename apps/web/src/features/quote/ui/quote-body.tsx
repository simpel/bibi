import type { QuoteDto } from "@bibi/core";
import type { ReactNode } from "react";
import { getDateTimeFormat } from "@/server/date-time-format";
import { getNumberFormat } from "@/server/number-format";
import { currentQuote, type QuoteAbilities } from "./quote-abilities";
import { QuoteDraftHint } from "./quote-draft-hint";
import { QuoteDrift } from "./quote-drift";
import { QuoteLinesTable } from "./quote-lines-table";
import { QuoteNextStep } from "./quote-next-step";
import { QuoteOtherVersions } from "./quote-other-versions";
import { QuoteStats } from "./quote-stats";
import { QuoteTotals } from "./quote-totals";

export type QuoteBodyProps = {
  quote: QuoteDto;
  /** Every version of the order's quote, `quote` included. */
  versions: readonly QuoteDto[];
  can: QuoteAbilities;
  /** More facts under the next step, e.g. the terms and the salesperson on the quote page. */
  facts?: ReactNode;
};

/**
 * One quote version as the quote page and the order's quote tab show it: stat cards, the next
 * step, the lines and totals, how the order differs, and links to the other versions.
 */
export async function QuoteBody({ quote, versions, can, facts }: QuoteBodyProps) {
  const [format, numbers] = await Promise.all([getDateTimeFormat(), getNumberFormat()]);
  const current = currentQuote({ quotes: versions }) ?? quote;
  return (
    <div className="grid gap-6">
      <QuoteStats quote={quote} current={current} numbers={numbers} format={format} />
      <QuoteNextStep quote={quote} current={current} can={can} format={format} />
      {facts}
      <QuoteDraftHint quote={quote} />
      <QuoteLinesTable lines={quote.lines} removedLines={quote.removedLines} />
      <QuoteTotals quote={quote} numbers={numbers} />
      <QuoteDrift quote={quote} />
      <QuoteOtherVersions quote={quote} versions={versions} numbers={numbers} />
    </div>
  );
}
