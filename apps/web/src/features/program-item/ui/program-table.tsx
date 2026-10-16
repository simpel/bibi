import type { ProgramItemDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { nameOf } from "../../booking/ui/booking-form-data";
import type { ProgramFormData } from "./program-form-data";
import { ProgramRowActions } from "./program-row-actions";

export type ProgramTableProps = {
  programItems: ProgramItemDto[];
  data: ProgramFormData;
  canWrite: boolean;
};

const COLUMNS = ["time", "name", "type", "where", "quantity", "responsible"] as const;

type PlaceOfInput = { programItem: ProgramItemDto; data: ProgramFormData };

/** "Room · Setup", or "–" without an item. */
const placeOf = ({ programItem: { itemId, setupId }, data }: PlaceOfInput) =>
  [
    nameOf({ options: data.items, id: itemId }),
    setupId ? nameOf({ options: data.setups, id: setupId }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

/** The run schedule: time, what, type, where (item and setup), quantity and who is responsible. */
export async function ProgramTable({ programItems, data, canWrite }: ProgramTableProps) {
  const t = await getTranslations("programItem");
  const common = await getTranslations("common");
  const format = await getFormatter();
  const period = ({ startsAt, endsAt }: ProgramItemDto) =>
    format.dateTimeRange(startsAt, endsAt, { dateStyle: "short", timeStyle: "short" });
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHead key={column}>{t(`columns.${column}`)}</TableHead>
          ))}
          <TableHead className="w-32">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="whitespace-nowrap">{period(item)}</TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{nameOf({ options: data.types, id: item.entityTypeId })}</TableCell>
            <TableCell>{placeOf({ programItem: item, data })}</TableCell>
            <TableCell>{item.quantity ?? "–"}</TableCell>
            <TableCell>{nameOf({ options: data.members, id: item.responsibleId })}</TableCell>
            <TableCell>
              {canWrite ? <ProgramRowActions programItem={item} data={data} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
