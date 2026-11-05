"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { NamedOption } from "@/components/form/named-option";
import type { RowAccess } from "@/lib/can";
import { useTemplateColumns } from "./use-template-columns";

export type OrderTemplateTableProps = {
  templates: OrderTemplateDto[];
  statuses: (NamedOption & { color?: string | undefined })[];
  types: NamedOption[];
  access: RowAccess;
};

/** The organization's predefined orders; admins get row actions. */
export function OrderTemplateTable({
  templates,
  statuses,
  types,
  access,
}: OrderTemplateTableProps) {
  const t = useTranslations("orderTemplate");
  const columns = useTemplateColumns({ statuses, types, access });
  return (
    <PersistedDataTable
      tableId="order-template.list"
      columns={columns}
      data={templates}
      getRowId={(template) => template.id}
      emptyText={t("empty")}
    />
  );
}
