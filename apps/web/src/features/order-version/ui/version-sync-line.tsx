import type { OrderDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { loadOrderVersions } from "../load-order-versions";
import { latestSentVersion } from "../sent-version";
import { VersionSyncPill } from "./versions-panel";

export type VersionSyncLineProps = { order: Pick<OrderDto, "id" | "statusId"> };

/**
 * Whether the order still matches the quote last sent (ADR 0116): "Matches quote v2", or "3
 * changes since quote v2 · Show", a pill that opens the versions. Nothing before a quote is sent.
 */
export async function VersionSyncLine({ order }: VersionSyncLineProps) {
  const [t, versions] = await Promise.all([
    getTranslations("orderVersion.sync"),
    loadOrderVersions(order.id),
  ]);
  const sent = versions.ok ? latestSentVersion({ versions: versions.value.items }) : null;
  if (!sent) return null;
  const { version, quoteVersion } = sent;
  const matches = version.isCurrent;
  return (
    <VersionSyncPill changed={!matches}>
      {matches
        ? t("matches", { version: quoteVersion })
        : t("changedShow", { count: version.changeCount, version: quoteVersion })}
    </VersionSyncPill>
  );
}
