import { listOrderStatuses } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { StatusGridEditor } from "@/features/status-grid/ui/status-grid-editor";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateOrderStatusButton } from "./create-order-status-button";
import { FlowEditor } from "./flow-editor";
import { ImportOrderStatusTemplateButton } from "./import-order-status-template-button";
import { OrderStatusTable } from "./order-status-table";

export type OrderStatusListProps = { locale: Locale; inTab?: boolean };

/** An organization has a handful of statuses; reordering needs all of them on one page. */
const PAGE_SIZE = 100;

/** Order statuses page body: header with admin actions, the ordered table, flow and grid. */
export async function OrderStatusList({ locale, inTab = false }: OrderStatusListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("orderStatus"),
    getCallerAbilities(),
    runOperation({ operation: listOrderStatuses, input: { limit: PAGE_SIZE } }),
  ]);
  const canWrite = can({ abilities, permission: "pipeline:write" });
  const create = canWrite ? <CreateOrderStatusButton /> : undefined;
  const header = (
    <AdminHeader
      title={t("plural")}
      description={t("listDescription")}
      inTab={inTab}
      actions={
        canWrite ? (
          <>
            <ImportOrderStatusTemplateButton />
            {create}
          </>
        ) : undefined
      }
    />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminPage header={header}>
        <ErrorState errorKey={errorKey} inline={inTab} />
      </AdminPage>
    );
  }
  const { items } = result.value;
  const access = rowAccess({ abilities, feature: "pipeline" });
  return (
    <AdminPage header={header}>
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <OrderStatusTable statuses={items} access={access} />
      )}
      {canWrite ? <FlowEditor statuses={items} /> : null}
      <StatusGridEditor locale={locale} />
    </AdminPage>
  );
}
