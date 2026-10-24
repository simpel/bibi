import type { TicketStatusDto } from "@bibi/core/schemas";
import { DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMoveStatus } from "./use-move-status";

export type MoveItemsProps = { statuses: readonly TicketStatusDto[]; index: number };

/** The "move up / move down" menu items of a status row. */
export function MoveItems({ statuses, index }: MoveItemsProps) {
  const t = useTranslations("ticketStatus");
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
