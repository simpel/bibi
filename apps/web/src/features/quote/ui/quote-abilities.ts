import { canQuoteTransition, type QuoteDto } from "@bibi/core";
import type { QuoteAbilities } from "./quote-actions";

export type QuoteAbilitiesInput = {
  quote: QuoteDto;
  /** The highest version of the order's quote. */
  latestVersion: number;
  /** The caller holds `quote:write` (edit, accept, decline, expire, revise). */
  canEdit: boolean;
  /** The caller holds `quote:write`. */
  canSend: boolean;
  /** The caller holds `program:write`: the order can be restored to the quote's version. */
  canRestore: boolean;
};

/** The only place that decides which quote buttons are shown (the operations check anyway). */
export function quoteAbilities({
  quote,
  latestVersion,
  canEdit,
  canSend,
  canRestore,
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
    restore: canRestore && from !== "DRAFT" && quote.versionId !== null,
  };
}
