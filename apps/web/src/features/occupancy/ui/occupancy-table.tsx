import { MANUAL_OCCUPANCY_TYPES, type OccupancyDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { OccupancyRowActions } from "./occupancy-row-actions";

export type OccupancyTableProps = { occupancies: OccupancyDto[]; canWrite: boolean };

const isManual = ({ type }: OccupancyDto) =>
  (MANUAL_OCCUPANCY_TYPES as readonly string[]).includes(type);

/** Occupancy rows: type, period and note; manual blocks can be edited and released. */
export async function OccupancyTable({ occupancies, canWrite }: OccupancyTableProps) {
  const t = await getTranslations("occupancy");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const when = ({ date }: { date: Date }) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.type")}</TableHead>
          <TableHead>{t("columns.startsAt")}</TableHead>
          <TableHead>{t("columns.endsAt")}</TableHead>
          <TableHead>{t("columns.note")}</TableHead>
          <TableHead className="w-24">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {occupancies.map((occupancy) => (
          <TableRow key={occupancy.id}>
            <TableCell className="font-medium">{t(`types.${occupancy.type}`)}</TableCell>
            <TableCell>{when({ date: occupancy.startsAt })}</TableCell>
            <TableCell>{when({ date: occupancy.endsAt })}</TableCell>
            <TableCell>{occupancy.note ?? "–"}</TableCell>
            <TableCell>
              {canWrite && isManual(occupancy) ? (
                <OccupancyRowActions occupancy={occupancy} />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
