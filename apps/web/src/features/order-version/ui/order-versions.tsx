import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getOrderAbilities } from "@/features/order/order-abilities";
import { can } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadOrderVersions } from "../load-order-versions";
import { VersionTable } from "./version-table";

export type OrderVersionsProps = {
  locale: Locale;
  order: OrderDto;
  /** Its own "Versions" title (the Activity tab); without it the Program's panel carries one. */
  heading?: boolean;
};

/**
 * The order's versions (ADR 0116): captured after every change, each with the quotes sent as it
 * and how far the order has moved from it; restore and name from the row. Shown in the Program's
 * versions panel and on the Activity tab.
 */
export async function OrderVersions({ locale, order, heading }: OrderVersionsProps) {
  const [t, abilities, versions] = await Promise.all([
    getTranslations("orderVersion"),
    getOrderAbilities({ order }),
    loadOrderVersions(order.id),
  ]);
  if (!versions.ok) {
    if (versions.error.code === "FORBIDDEN") return null;
    return <ErrorState inline errorKey={handleLoadError({ error: versions.error, locale })} />;
  }
  return (
    <div className="grid grid-cols-1 gap-3">
      {heading ? <h2 className="text-xl">{t("title")}</h2> : null}
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <VersionTable
        versions={versions.value.items}
        canEdit={can({ abilities, permission: "program:write" })}
      />
    </div>
  );
}
