import type { BookingStatusDto } from "@okazi/core/schemas";
import { DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMoveStatus } from "./use-move-status";

export type MoveItemsProps = { statuses: readonly BookingStatusDto[]; index: number };

/** The "move up / move down" menu items of a status row. */
export function MoveItems({ statuses, index }: MoveItemsProps) {
  const t = useTranslations("bookingStatus");
  const { canMove, move } = useMoveStatus({ statuses, index });
  return (
    <>
      <DropdownMenuItem
        disabled={!canMove({ to: index - 1 })}
        onSelect={() => move({ to: index - 1 })}
      >
        {t("moveUp")}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={!canMove({ to: index + 1 })}
        onSelect={() => move({ to: index + 1 })}
      >
        {t("moveDown")}
      </DropdownMenuItem>
    </>
  );
}
