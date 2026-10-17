"use client";

import type { VenueDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useVenueColumns } from "./use-venue-columns";
import { VenueRowActions } from "./venue-row-actions";

export type VenueTableProps = { venues: VenueDto[] };

export function VenueTable({ venues }: VenueTableProps) {
  const t = useTranslations("venue");
  const columns = useVenueColumns<VenueDto>({
    renderActions: (venue) => <VenueRowActions venue={venue} />,
  });
  return (
    <PersistedDataTable
      tableId="venue"
      columns={columns}
      data={venues}
      getRowId={(venue) => venue.id}
      emptyText={t("empty")}
    />
  );
}
