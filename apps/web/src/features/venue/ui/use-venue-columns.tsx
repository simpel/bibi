import type { VenueDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import { actionsColumn, Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { venueRoute } from "@/lib/routes";

export type VenueRow = Pick<
  VenueDto,
  "id" | "name" | "city" | "contactEmail" | "contactPhone" | "status"
>;

export type UseVenueColumnsInput<TRow extends VenueRow> = {
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: TRow) => ReactNode;
};

/** Columns of the venue table, shared by the venue list and the assistant card. */
export function useVenueColumns<TRow extends VenueRow>({
  renderActions,
}: UseVenueColumnsInput<TRow>): ColumnDef<TRow>[] {
  const t = useTranslations("venue.columns");
  const common = useTranslations("common");
  const statusLabel = ({ venue }: { venue: VenueRow }) =>
    venue.status === "ACTIVE" ? common("active") : common("archived");
  const actionColumn: ColumnDef<TRow>[] = renderActions
    ? [actionsColumn<TRow>({ label: common("actions"), cell: renderActions })]
    : [];
  return [
    {
      id: "name",
      header: t("name"),
      accessorFn: (v) => v.name,
      cell: ({ row }) => (
        <Link href={venueRoute({ id: row.original.id })} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    { id: "city", header: t("city"), accessorFn: (v) => v.city ?? "–" },
    {
      id: "contact",
      header: t("contact"),
      accessorFn: (v) => v.contactEmail ?? v.contactPhone ?? "–",
    },
    {
      id: "status",
      header: t("status"),
      accessorFn: (venue) => statusLabel({ venue }),
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "success" : "secondary"}>
          {statusLabel({ venue: row.original })}
        </Badge>
      ),
    },
    ...actionColumn,
  ];
}
