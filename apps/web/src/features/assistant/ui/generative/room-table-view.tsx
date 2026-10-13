"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { venueRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type RoomTableViewProps = GenerativeProps<"room-table">;

/** A page of rooms; each name links to the room's venue page. */
export function RoomTableView({ items, nextCursor }: RoomTableViewProps) {
  const t = useTranslations("room");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="room-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.floor")}</TableHead>
            <TableHead>{t("columns.capacity")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">
                <Link href={venueRoute({ id: room.venueId })} className="hover:underline">
                  {room.name}
                </Link>
              </TableCell>
              <TableCell>{room.floor ?? "–"}</TableCell>
              <TableCell>
                {room.maxCapacity === null ? "–" : t("capacityValue", { count: room.maxCapacity })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
