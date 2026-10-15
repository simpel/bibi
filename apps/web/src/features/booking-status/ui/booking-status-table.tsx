import type { BookingStatusDto } from "@okazi/core/schemas";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { BookingStatusRow } from "./booking-status-row";

export type BookingStatusTableProps = { statuses: BookingStatusDto[]; canAdmin: boolean };

/** The organization's statuses in order: phase, allowed transitions and admin controls. */
export async function BookingStatusTable({ statuses, canAdmin }: BookingStatusTableProps) {
  const t = await getTranslations("bookingStatus");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {canAdmin ? <TableHead className="w-24">{t("columns.order")}</TableHead> : null}
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.phase")}</TableHead>
          <TableHead>{t("columns.transitions")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statuses.map((status, index) => (
          <BookingStatusRow key={status.id} statuses={statuses} index={index} canAdmin={canAdmin} />
        ))}
      </TableBody>
    </Table>
  );
}
