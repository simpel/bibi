"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { NamedOption } from "@/components/form/named-option";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { OrderTemplateRowMenu, orderTemplateEditHref } from "./order-template-row-actions";
import { useTemplateColumns } from "./use-template-columns";

export type OrderTemplateTableProps = {
  templates: OrderTemplateDto[];
  statuses: (NamedOption & { color?: string | undefined })[];
  types: NamedOption[];
  access: RowAccess;
};

const NO_QUALIFIERS: TableQualifier<OrderTemplateDto>[] = [];

/** The organization's predefined orders; admins get row actions. */
export function OrderTemplateTable({
  templates,
  statuses,
  types,
  access,
}: OrderTemplateTableProps) {
  const t = useTranslations("orderTemplate");
  const router = useRouter();
  const columns = useTemplateColumns({ statuses, types, access });
  const view = useClientTableView({
    rows: templates,
    qualifiers: NO_QUALIFIERS,
    getSearchText: (template) => template.name,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="order-template.list"
        columns={columns}
        data={view.rows}
        getRowId={(template) => template.id}
        {...(access.canEdit
          ? {
              onRowClick: (template: OrderTemplateDto) =>
                router.push(orderTemplateEditHref({ id: template.id })),
            }
          : {})}
        rowMenu={(template) => <OrderTemplateRowMenu template={template} access={access} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
