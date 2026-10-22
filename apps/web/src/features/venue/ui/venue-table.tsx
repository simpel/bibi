"use client";

import type { VenueDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { useVenueColumns } from "./use-venue-columns";
import { VenueRowActions } from "./venue-row-actions";

export type VenueTableProps = { venues: VenueDto[]; access: RowAccess };

export function VenueTable({ venues, access }: VenueTableProps) {
  const t = useTranslations("venue");
  const columns = useVenueColumns<VenueDto>({
    ...(access.canEdit || access.canRemove
      ? { renderActions: (venue) => <VenueRowActions venue={venue} access={access} /> }
      : {}),
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
