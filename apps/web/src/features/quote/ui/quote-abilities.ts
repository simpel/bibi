import { canQuoteTransition, type QuoteDto } from "@okazi/core";
import type { QuoteAbilities } from "./quote-actions";

export type QuoteAbilitiesInput = {
  quote: QuoteDto;
  /** The highest version of the ticket's quote. */
  latestVersion: number;
  /** The caller holds `quote:edit` (edit, accept, decline, expire, revise). */
  canEdit: boolean;
  /** The caller holds `quote:send`. */
  canSend: boolean;
};

/** The only place that decides which quote buttons are shown (the operations check anyway). */
export function quoteAbilities({
  quote,
  latestVersion,
  canEdit,
  canSend,
}: QuoteAbilitiesInput): QuoteAbilities {
  const from = quote.quoteStatus;
  const revisable = from !== "DRAFT" && from !== "ACCEPTED" && quote.version === latestVersion;
  return {
    edit: canEdit && from === "DRAFT",
    send: canSend && canQuoteTransition({ from, to: "SENT" }),
    accept: canEdit && canQuoteTransition({ from, to: "ACCEPTED" }),
    decline: canEdit && canQuoteTransition({ from, to: "DECLINED" }),
    expire: canEdit && canQuoteTransition({ from, to: "EXPIRED" }),
    revise: canEdit && revisable,
  };
}
