import type { ItemStateDto } from "@okazi/core/schemas";
import { Link } from "@okazi/i18n/navigation";
import { DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { useMoveState } from "./use-move-state";

export type EditStateItemProps = { id: string };

/** The "Edit state" menu item: a link to the update page. */
export function EditStateItem({ id }: EditStateItemProps) {
  const t = useTranslations("itemState");
  const detail = listItemRoute({ list: ROUTES.settingsItemStates, id });
  return (
    <DropdownMenuItem asChild>
      <Link href={updateRoute({ detail })}>{t("edit")}</Link>
    </DropdownMenuItem>
  );
}

export type MoveStateItemsProps = { states: readonly ItemStateDto[]; index: number };

/** The "move up / move down" menu items of a state row. */
export function MoveStateItems({ states, index }: MoveStateItemsProps) {
  const t = useTranslations("itemState");
  const { canMove, move } = useMoveState({ states, index });
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
