import { listOrderTemplates } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadOrderTemplateData } from "../load-order-template-data";
import { CreateOrderTemplateButton } from "./create-order-template-button";
import { OrderTemplateTable } from "./order-template-table";

export type OrderTemplateListProps = { locale: Locale };

/** An organization has a handful of packages: one page, paged in the client. */
const PAGE_SIZE = 100;

/** `/packages` (ADR 0112): header with create, search and the table. */
export async function OrderTemplateList({ locale }: OrderTemplateListProps) {
  const [t, abilities, result, data] = await Promise.all([
    getTranslations("orderTemplate"),
    getCallerAbilities(),
    runOperation({ operation: listOrderTemplates, input: { limit: PAGE_SIZE } }),
    loadOrderTemplateData(),
  ]);
  const create = can({ abilities, permission: "orderTemplate:write" }) ? (
    <CreateOrderTemplateButton />
  ) : undefined;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
  );
  const failed = !result.ok ? result : !data.ok ? data : null;
  if (failed) {
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={handleLoadError({ error: failed.error, locale })} />
      </div>
    );
  }
  if (!result.ok || !data.ok) return null;
  const { items } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <OrderTemplateTable
          templates={items}
          statuses={data.value.statuses}
          types={data.value.orderTypes}
          access={rowAccess({ abilities, feature: "orderTemplate" })}
        />
      )}
    </div>
  );
}
