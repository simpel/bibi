import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
import { collapseSingleChoice, type TitleRowAction } from "./header-action";
import { HeaderActionItems } from "./header-action-items";

export type HeaderActionButtonProps = { action: TitleRowAction; variant: "default" | "outline" };

/**
 * One action as a button, or as a button that opens its menu. One icon per button (no chevron),
 * and a single choice runs directly instead of opening a menu.
 */
export function HeaderActionButton({ action: raw, variant }: HeaderActionButtonProps) {
  const action = collapseSingleChoice({ action: raw });
  const content = (
    <>
      {raw.icon}
      {action.label}
    </>
  );
  if (!action.items) {
    return (
      <Button type="button" variant={variant} onClick={action.onSelect}>
        {content}
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={variant}>
          {content}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <HeaderActionItems actions={action.items} parentIcon={raw.icon} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
