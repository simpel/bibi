import type { OrderDto } from "@bibi/core";
import { ColorSwatch } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getOrderAbilities } from "@/features/order/order-abilities";
import { can } from "@/server/caller-abilities";
import { loadOrderVersions } from "../load-order-versions";
import { latestSentVersion } from "../sent-version";
import { VersionSyncButton } from "./version-sync-button";

export type VersionSyncLineProps = { order: Pick<OrderDto, "id" | "statusId"> };

/**
 * Whether the order still matches the quote last sent (ADR 0116): "Matches quote v2", or "3
 * changes since quote v2" with the changes and Restore. Nothing before a quote is sent.
 */
export async function VersionSyncLine({ order }: VersionSyncLineProps) {
  const [t, abilities, versions] = await Promise.all([
    getTranslations("orderVersion.sync"),
    getOrderAbilities({ order }),
    loadOrderVersions(order.id),
  ]);
  const sent = versions.ok ? latestSentVersion({ versions: versions.value.items }) : null;
  if (!sent) return null;
  const { version, quoteVersion } = sent;
  const matches = version.isCurrent;
  return (
    <p data-slot="version-sync" className="flex flex-wrap items-center gap-2 text-sm">
      <ColorSwatch color={matches ? "var(--success)" : "var(--warning)"} />
      {matches
        ? t("matches", { version: quoteVersion })
        : t("changed", { count: version.changeCount, version: quoteVersion })}
      {matches ? null : (
        <VersionSyncButton
          versionId={version.id}
          title={t("dialogTitle", { version: quoteVersion })}
          canRestore={can({ abilities, permission: "program:write" })}
        >
          {t("show")}
        </VersionSyncButton>
      )}
    </p>
  );
}
