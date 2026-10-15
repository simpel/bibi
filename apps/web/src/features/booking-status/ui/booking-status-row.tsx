import type { BookingStatusDto } from "@okazi/core/schemas";
import { Badge, ColorSwatch, TableCell, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { BookingStatusRowActions } from "./booking-status-row-actions";
import { MoveStatusButtons } from "./move-status-buttons";

export type BookingStatusRowProps = {
  statuses: BookingStatusDto[];
  index: number;
  canAdmin: boolean;
};

/** One status: order controls, name with color, phase and the statuses it may move to. */
export async function BookingStatusRow({ statuses, index, canAdmin }: BookingStatusRowProps) {
  const t = await getTranslations("bookingStatus");
  const status = statuses[index];
  if (!status) return null;
  const targets = status.transitionsTo.map(
    (id) => statuses.find((target) => target.id === id)?.name ?? id,
  );
  const isDefault = statuses[index - 1]?.phase !== status.phase;
  return (
    <TableRow>
      {canAdmin ? (
        <TableCell>
          <MoveStatusButtons statuses={statuses} index={index} />
        </TableCell>
      ) : null}
      <TableCell className="font-medium">
        <span className="inline-flex items-center gap-2">
          <ColorSwatch color={status.color} />
          {status.name}
          {isDefault ? <Badge variant="outline">{t("default")}</Badge> : null}
        </span>
      </TableCell>
      <TableCell>{t(`phases.${status.phase}`)}</TableCell>
      <TableCell>{targets.join(", ") || t("noTransitions")}</TableCell>
      <TableCell>
        {canAdmin ? <BookingStatusRowActions status={status} statuses={statuses} /> : null}
      </TableCell>
    </TableRow>
  );
}
