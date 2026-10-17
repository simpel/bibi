"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useVenueColumns } from "@/features/venue/ui/use-venue-columns";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type VenueTableViewProps = GenerativeProps<"venue-table">;

/** A page of venues; each name links to the venue page. */
export function VenueTableView({ items, nextCursor }: VenueTableViewProps) {
  const t = useTranslations("venue");
  const columns = useVenueColumns<(typeof items)[number]>({});
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="venue-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="venue"
        columns={columns}
        data={items}
        getRowId={(venue) => venue.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
