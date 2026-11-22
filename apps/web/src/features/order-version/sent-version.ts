import type { OrderVersionDto } from "@bibi/core/schemas";

/** Quote states that mean the version went to the customer. */
const SENT = new Set(["SENT", "ACCEPTED", "SUPERSEDED", "DECLINED", "EXPIRED"]);

export type SentVersion = { version: OrderVersionDto; quoteVersion: number; status: string };

/** The newest version sent as a quote, with that quote's number and status; null if none. */
export function latestSentVersion({
  versions,
}: {
  versions: readonly OrderVersionDto[];
}): SentVersion | null {
  for (const version of versions) {
    const sent = [...version.quotes].reverse().find((quote) => SENT.has(quote.quoteStatus));
    if (sent) return { version, quoteVersion: sent.version, status: sent.quoteStatus };
  }
  return null;
}
