"use client";

import { Link } from "@okazi/i18n/navigation";
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { venueRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type VenueTableViewProps = GenerativeProps<"venue-table">;

/** A page of venues; each name links to the venue page. */
export function VenueTableView({ items, nextCursor }: VenueTableViewProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="venue-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.city")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((venue) => (
            <TableRow key={venue.id}>
              <TableCell className="font-medium">
                <Link href={venueRoute({ id: venue.id })} className="hover:underline">
                  {venue.name}
                </Link>
              </TableCell>
              <TableCell>{venue.city ?? "–"}</TableCell>
              <TableCell>
                <Badge variant={venue.status === "ACTIVE" ? "success" : "secondary"}>
                  {venue.status === "ACTIVE" ? common("active") : common("archived")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
