import type { VenueDto } from "@bibi/core";
import { actionsColumn, type ColumnDef, createTableColumns, statusColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { Link } from "@/lib/navigation";
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
  return useMemo(
    () =>
      createTableColumns<TRow>({
        primary: [
          {
            id: "name",
            header: t("name"),
            accessorFn: (v) => v.name,
            cell: ({ row }) => (
              <Link
                href={venueRoute({ id: row.original.id })}
                className="font-medium hover:underline"
              >
                {row.original.name}
              </Link>
            ),
          },
        ],
        relations: [
          { id: "city", header: t("city"), accessorFn: (v) => v.city ?? "–" },
          {
            id: "contact",
            header: t("contact"),
            accessorFn: (v) => v.contactEmail ?? v.contactPhone ?? "–",
          },
        ],
        status: [
          statusColumn<TRow>({
            header: t("status"),
            getStatus: (venue) => ({
              label: venue.status === "ACTIVE" ? common("active") : common("archived"),
              color: venue.status === "ACTIVE" ? "var(--success)" : "var(--muted-foreground)",
            }),
          }),
        ],
        actions: renderActions
          ? [actionsColumn<TRow>({ label: common("actions"), cell: renderActions })]
          : [],
      }),
    [t, common, renderActions],
  );
}
