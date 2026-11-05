import { listOrderStatuses } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { StatusGridEditor } from "@/features/status-grid/ui/status-grid-editor";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateOrderStatusButton } from "./create-order-status-button";
import { FlowEditor } from "./flow-editor";
import { ImportOrderStatusTemplateButton } from "./import-order-status-template-button";
import { OrderStatusTable } from "./order-status-table";

export type OrderStatusListProps = { locale: Locale };

/** An organization has a handful of statuses; reordering needs all of them on one page. */
const PAGE_SIZE = 100;

/** Order statuses page body: header with admin actions and the ordered table. */
export async function OrderStatusList({ locale }: OrderStatusListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("orderStatus"),
    getCallerAbilities(),
    runOperation({ operation: listOrderStatuses, input: { limit: PAGE_SIZE } }),
  ]);
  const actions = can({ abilities, permission: "pipeline:write" }) ? (
    <>
      <ImportOrderStatusTemplateButton />
      <CreateOrderStatusButton />
    </>
  ) : undefined;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { items } = result.value;
  const access = rowAccess({ abilities, feature: "pipeline" });
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={actions} />
      ) : (
        <OrderStatusTable statuses={items} access={access} />
      )}
      {can({ abilities, permission: "pipeline:write" }) ? <FlowEditor statuses={items} /> : null}
      <StatusGridEditor locale={locale} />
    </div>
  );
}
