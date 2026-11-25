import "server-only";
import { getTranslations } from "next-intl/server";
import { getNumberFormat } from "@/server/number-format";
import { loadOrderVersions } from "./load-order-versions";
import { latestSentVersion } from "./sent-version";

export type QuoteFact = { value: string; preheader: string };

/**
 * The quoted sum for the order's key facts (ADR 0116): the total incl. VAT of the quote last sent,
 * with whether the order still matches it above. Null before a quote is sent, or without
 * `program:read` or `quote:read`.
 */
export async function loadQuoteFact({ orderId }: { orderId: string }): Promise<QuoteFact | null> {
  const [t, { money }, versions] = await Promise.all([
    getTranslations("orderVersion.sync"),
    getNumberFormat(),
    loadOrderVersions(orderId),
  ]);
  if (!versions.ok) return null;
  const sent = latestSentVersion({ versions: versions.value.items });
  if (!sent) return null;
  const preheader = sent.version.isCurrent
    ? t("matches", { version: sent.quoteVersion })
    : t("changed", { count: sent.version.changeCount, version: sent.quoteVersion });
  return { value: money({ minor: sent.totalInclVatMinor }), preheader };
}
