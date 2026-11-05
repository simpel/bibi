"use client";

import type { VenueDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import type { QuickFilterPill } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { venueRoute } from "@/lib/routes";
import { useVenueColumns } from "./use-venue-columns";
import { VenueRowActions, VenueRowMenu } from "./venue-row-actions";

export type VenueTableProps = { venues: VenueDto[]; access: RowAccess };

export function VenueTable({ venues, access }: VenueTableProps) {
  const t = useTranslations("venue");
  const cols = useTranslations("venue.columns");
  const common = useTranslations("common");
  const router = useRouter();
  const active = common("active");
  const archived = common("archived");
  const qualifiers = useMemo<TableQualifier<VenueDto>[]>(
    () => [
      {
        key: "status",
        label: cols("status"),
        hint: `${active}, ${archived}`,
        pick: (v) => (v.status === "ACTIVE" ? active : archived),
        options: [active, archived],
      },
      {
        key: "city",
        label: cols("city"),
        hint: cols("city"),
        pick: (v) => v.city,
        options: venues.flatMap((v) => (v.city ? [v.city] : [])),
      },
    ],
    [cols, active, archived, venues],
  );
  const pills: QuickFilterPill[] = [
    { key: "all", label: common("readFilter.all"), query: undefined },
    { key: "active", label: active, query: `status:${active}` },
    { key: "archived", label: archived, query: `status:${archived}` },
  ];
  const columns = useVenueColumns<VenueDto>({
    renderActions: (venue) => <VenueRowActions venue={venue} access={access} />,
  });
  return (
    <ClientDataTable
      tableId="venue"
      columns={columns}
      data={venues}
      qualifiers={qualifiers}
      pills={pills}
      getSearchText={(v) =>
        `${v.name} ${v.city ?? ""} ${v.contactEmail ?? ""} ${v.contactPhone ?? ""}`
      }
      getRowId={(venue) => venue.id}
      onRowClick={(venue) => router.push(venueRoute({ id: venue.id }))}
      rowMenu={(venue) => <VenueRowMenu venue={venue} access={access} />}
      emptyText={t("empty")}
    />
  );
}
