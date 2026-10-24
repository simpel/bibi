"use client";

import type { TicketTemplateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { NamedOption } from "@/components/form/named-option";
import type { RowAccess } from "@/lib/can";
import { useTemplateColumns } from "./use-template-columns";

export type TicketTemplateTableProps = {
  templates: TicketTemplateDto[];
  statuses: NamedOption[];
  types: NamedOption[];
  access: RowAccess;
};

/** The organization's predefined tickets; admins get row actions. */
export function TicketTemplateTable({
  templates,
  statuses,
  types,
  access,
}: TicketTemplateTableProps) {
  const t = useTranslations("ticketTemplate");
  const columns = useTemplateColumns({ statuses, types, access });
  return (
    <PersistedDataTable
      tableId="ticket-template.list"
      columns={columns}
      data={templates}
      getRowId={(template) => template.id}
      emptyText={t("empty")}
    />
  );
}
