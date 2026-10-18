import { canQuoteTransition, type QuoteDto } from "@okazi/core";
import type { QuoteAbilities } from "./quote-actions";

export type QuoteAbilitiesInput = {
  quote: QuoteDto;
  /** The highest version of the ticket's quote. */
  latestVersion: number;
  /** The caller may write quotes. */
  canWrite: boolean;
};

/** The only place that decides which quote buttons are shown (the operations check anyway). */
export function quoteAbilities({
  quote,
  latestVersion,
  canWrite,
}: QuoteAbilitiesInput): QuoteAbilities {
  const from = quote.quoteStatus;
  const revisable = from !== "DRAFT" && from !== "ACCEPTED" && quote.version === latestVersion;
  return {
    edit: canWrite && from === "DRAFT",
    send: canWrite && canQuoteTransition({ from, to: "SENT" }),
    decline: canWrite && canQuoteTransition({ from, to: "DECLINED" }),
    expire: canWrite && canQuoteTransition({ from, to: "EXPIRED" }),
    revise: canWrite && revisable,
  };
}
