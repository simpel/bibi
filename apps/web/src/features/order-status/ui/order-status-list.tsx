import { listOrderStatuses } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { StatusGridEditor } from "@/features/status-grid/ui/status-grid-editor";
import type { ErrorKey } from "@/lib/error-key";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateOrderStatusButton } from "./create-order-status-button";
import { FlowEditor } from "./flow-editor";
import { ImportOrderStatusTemplateButton } from "./import-order-status-template-button";
import { OrderStatusTable } from "./order-status-table";

export type OrderStatusListProps = { locale: Locale; show: ReadonlySet<AdminSectionId> };

/** An organization has a handful of statuses; reordering needs all of them on one page. */
const PAGE_SIZE = 100;

/** The pipeline sections: `statuses`, `flow-rules` and `status-grid`, each only when shown. */
export async function OrderStatusList({ locale, show }: OrderStatusListProps) {
  const needsStatuses = show.has("orderStatuses") || show.has("flowRules");
  const [t, abilities, result] = await Promise.all([
    getTranslations("orderStatus"),
    getCallerAbilities(),
    needsStatuses
      ? runOperation({ operation: listOrderStatuses, input: { limit: PAGE_SIZE } })
      : undefined,
  ]);
  const canWrite = can({ abilities, permission: "pipeline:write" });
  const create = canWrite ? <CreateOrderStatusButton /> : undefined;
  const errorKey: ErrorKey | undefined =
    result && !result.ok ? handleLoadError({ error: result.error, locale }) : undefined;
  const items = result?.ok ? result.value.items : [];
  // Without statuses or the right to create one, the statuses section stays off the page.
  const showStatuses =
    show.has("orderStatuses") && (Boolean(errorKey) || items.length > 0 || canWrite);
  return (
    <>
      {showStatuses ? (
        <AdminSection
          section="orderStatuses"
          description={t("listDescription")}
          actions={
            canWrite ? (
              <>
                <ImportOrderStatusTemplateButton />
                {create}
              </>
            ) : undefined
          }
        >
          {errorKey ? (
            <ErrorState errorKey={errorKey} inline />
          ) : items.length === 0 ? (
            <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
          ) : (
            <OrderStatusTable
              statuses={items}
              access={rowAccess({ abilities, feature: "pipeline" })}
            />
          )}
        </AdminSection>
      ) : null}
      {show.has("flowRules") && canWrite ? (
        <FlowEditor statuses={items} errorKey={errorKey} />
      ) : null}
      {show.has("statusGrid") ? <StatusGridEditor locale={locale} /> : null}
    </>
  );
}
