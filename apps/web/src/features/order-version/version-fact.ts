import "server-only";
import { getTranslations } from "next-intl/server";
import { loadOrderVersions } from "./load-order-versions";
import { latestSentVersion } from "./sent-version";

export type VersionFact = { value: string; preheader: string | undefined };

/**
 * The order's version for its key facts (ADR 0116): the newest version's number, with whether the
 * order still matches the quote last sent above it. Null without versions or `program:read`.
 */
export async function loadVersionFact({
  orderId,
}: {
  orderId: string;
}): Promise<VersionFact | null> {
  const [t, versions] = await Promise.all([
    getTranslations("orderVersion.sync"),
    loadOrderVersions(orderId),
  ]);
  if (!versions.ok) return null;
  const items = versions.value.items;
  const current = items.find(({ isCurrent }) => isCurrent) ?? items[0];
  if (!current) return null;
  const sent = latestSentVersion({ versions: items });
  const preheader = !sent
    ? undefined
    : sent.version.isCurrent
      ? t("matches", { version: sent.quoteVersion })
      : t("changed", { count: sent.version.changeCount, version: sent.quoteVersion });
  return { value: String(current.number), preheader };
}
