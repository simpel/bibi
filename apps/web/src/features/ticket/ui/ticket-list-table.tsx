import type { TicketDto } from "@bibi/core";
import type { TicketFormData } from "./ticket-form-data";
import { TicketTable, type TicketTablePage } from "./ticket-table";

export type TicketListTableProps = {
  tickets: TicketDto[];
  total: number;
  view: TicketTablePage;
  data: TicketFormData;
};

/** Hands the client table only what it shows (plain lookups, no form schemas or Maps). */
export function TicketListTable({ tickets, total, view, data }: TicketListTableProps) {
  return (
    <TicketTable
      tickets={tickets}
      total={total}
      view={view}
      customers={data.customers}
      customersHidden={data.customersHidden}
      types={data.types.map(({ id, name }) => ({ id, name }))}
      statuses={data.statuses}
      members={data.members}
    />
  );
}
