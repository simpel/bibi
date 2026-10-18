import type { TicketDto } from "@okazi/core";
import type { TicketFormData } from "./ticket-form-data";
import { TicketTable } from "./ticket-table";

export type TicketListTableProps = {
  tickets: TicketDto[];
  data: TicketFormData;
};

/** Hands the client table only what it shows (plain lookups, no form schemas or Maps). */
export function TicketListTable({ tickets, data }: TicketListTableProps) {
  return (
    <TicketTable
      tickets={tickets}
      customers={data.customers}
      types={data.types.map(({ id, name }) => ({ id, name }))}
      phases={data.phases}
    />
  );
}
