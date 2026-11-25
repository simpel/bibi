import { canQuoteTransition, type QuoteDto } from "@bibi/core";

export type QuoteAbilities = {
  edit: boolean;
  send: boolean;
  /** Accept a SENT quote, or a still valid SUPERSEDED one ("customer chose this version"). */
  accept: boolean;
  decline: boolean;
  expire: boolean;
  revise: boolean;
  /** `program:write` on a sent quote: restore the order to the version it was sent as. */
  restore: boolean;
  /** A still valid SUPERSEDED quote can be set as the current version again (`quote.reopen`). */
  reopen: boolean;
};

export type QuoteAbilitiesInput = {
  quote: QuoteDto;
  /** The highest version of the order's quote. */
  latestVersion: number;
  /** The caller holds `quote:write` (edit, send, accept, decline, expire, revise, reopen). */
  canEdit: boolean;
  /** The caller holds `program:write`: the order can be restored to the quote's version. */
  canRestore: boolean;
  /** The request's instant, to tell whether a replaced quote is still valid. */
  now: Date;
};

/** The only place that decides which quote commands are offered (the operations check anyway). */
export function quoteAbilities({
  quote,
  latestVersion,
  canEdit,
  canRestore,
  now,
}: QuoteAbilitiesInput): QuoteAbilities {
  const from = quote.quoteStatus;
  const revisable = from !== "DRAFT" && from !== "ACCEPTED" && quote.version === latestVersion;
  const valid = quote.validUntil !== null && quote.validUntil > now;
  const superseded = from === "SUPERSEDED";
  return {
    edit: canEdit && from === "DRAFT",
    send: canEdit && canQuoteTransition({ from, to: "SENT" }) && !superseded,
    accept: canEdit && canQuoteTransition({ from, to: "ACCEPTED" }) && (!superseded || valid),
    decline: canEdit && canQuoteTransition({ from, to: "DECLINED" }),
    expire: canEdit && canQuoteTransition({ from, to: "EXPIRED" }),
    revise: canEdit && revisable,
    restore: canRestore && from !== "DRAFT" && !superseded && quote.versionId !== null,
    reopen: canEdit && superseded && valid,
  };
}

/**
 * The version that counts now: the accepted one, else the one out with the customer, else the
 * newest (a draft, or the last declined or expired one). Null without quotes.
 */
export function currentQuote({ quotes }: { quotes: readonly QuoteDto[] }): QuoteDto | null {
  const newest = [...quotes].sort((a, b) => b.version - a.version);
  return (
    newest.find(({ quoteStatus }) => quoteStatus === "ACCEPTED") ??
    newest.find(({ quoteStatus }) => quoteStatus === "SENT") ??
    newest[0] ??
    null
  );
}
