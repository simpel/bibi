import type { TicketPhaseDto } from "@okazi/core/schemas";
import { DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMovePhase } from "./use-move-phase";

export type MoveItemsProps = { phases: readonly TicketPhaseDto[]; index: number };

/** The "move up / move down" menu items of a phase row. */
export function MoveItems({ phases, index }: MoveItemsProps) {
  const t = useTranslations("ticketPhase");
  const { canMove, move } = useMovePhase({ phases, index });
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
