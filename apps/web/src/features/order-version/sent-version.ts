import type { OrderVersionDto } from "@bibi/core/schemas";

/** Quote states that mean the version went to the customer. */
const SENT = new Set(["SENT", "ACCEPTED", "SUPERSEDED", "DECLINED", "EXPIRED"]);
/** Quote states of the version that counts now (one at most per order). */
const LIVE = new Set(["SENT", "ACCEPTED"]);

export type SentVersion = {
  version: OrderVersionDto;
  quoteVersion: number;
  status: string;
  totalInclVatMinor: number;
};

type Pick = { versions: readonly OrderVersionDto[]; states: ReadonlySet<string> };

function find({ versions, states }: Pick): SentVersion | null {
  for (const version of versions) {
    const sent = [...version.quotes].reverse().find((quote) => states.has(quote.quoteStatus));
    if (sent) {
      return {
        version,
        quoteVersion: sent.version,
        status: sent.quoteStatus,
        totalInclVatMinor: sent.totalInclVatMinor,
      };
    }
  }
  return null;
}

/**
 * The quote that counts, with its order version, number, status and total: the one out with the
 * customer or accepted (an older version set as current again included), else the newest one
 * sent. Null if none was sent.
 */
export function latestSentVersion({
  versions,
}: {
  versions: readonly OrderVersionDto[];
}): SentVersion | null {
  return find({ versions, states: LIVE }) ?? find({ versions, states: SENT });
}
