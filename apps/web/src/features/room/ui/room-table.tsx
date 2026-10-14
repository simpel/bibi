import type { RoomDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { RoomRowActions } from "./room-row-actions";

export type RoomTableProps = { rooms: RoomDto[]; venueName: string };

export async function RoomTable({ rooms, venueName }: RoomTableProps) {
  const t = await getTranslations("room");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.floor")}</TableHead>
          <TableHead>{t("columns.capacity")}</TableHead>
          <TableHead>{t("columns.area")}</TableHead>
          <TableHead>{t("columns.daylight")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rooms.map((room) => (
          <TableRow key={room.id}>
            <TableCell className="font-medium">{room.name}</TableCell>
            <TableCell>{room.floor ?? "–"}</TableCell>
            <TableCell>{room.maxCapacity ?? "–"}</TableCell>
            <TableCell>
              {room.areaSqm === null ? "–" : t("areaValue", { value: room.areaSqm })}
            </TableCell>
            <TableCell>{room.hasDaylight ? t("daylightYes") : t("daylightNo")}</TableCell>
            <TableCell>
              <RoomRowActions room={room} venueName={venueName} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
