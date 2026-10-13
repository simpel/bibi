import type { VenueDto } from "@okazi/core";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { Link } from "@okazi/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { venueRoute } from "@/lib/routes";
import { VenueRowActions } from "./venue-row-actions";

export type VenueTableProps = { venues: VenueDto[] };

export async function VenueTable({ venues }: VenueTableProps) {
  const t = await getTranslations("venue");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.city")}</TableHead>
          <TableHead>{t("columns.contact")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {venues.map((venue) => (
          <TableRow key={venue.id}>
            <TableCell className="font-medium">
              <Link href={venueRoute({ id: venue.id })} className="hover:underline">
                {venue.name}
              </Link>
            </TableCell>
            <TableCell>{venue.city ?? "–"}</TableCell>
            <TableCell>{venue.contactEmail ?? venue.contactPhone ?? "–"}</TableCell>
            <TableCell>
              <Badge variant="success">{common("active")}</Badge>
            </TableCell>
            <TableCell>
              <VenueRowActions venue={venue} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
