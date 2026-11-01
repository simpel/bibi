import type { ReactNode } from "react";
import { DropdownMenuItem } from "../dropdown-menu/dropdown-menu";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../dropdown-menu/dropdown-menu-sub";
import { collapseSingleChoice, type HeaderAction } from "./header-action";

export type HeaderActionItemsProps = { actions: HeaderAction[]; parentIcon: ReactNode };

/** Menu items, each with an icon (the parent's when it has none); a choice list is a submenu. */
export function HeaderActionItems({ actions, parentIcon }: HeaderActionItemsProps) {
  return actions.map((raw) => {
    const action = collapseSingleChoice({ action: raw });
    const icon = action.icon ?? parentIcon;
    return action.items ? (
      <DropdownMenuSub key={action.id}>
        <DropdownMenuSubTrigger>
          {icon}
          {action.label}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <HeaderActionItems actions={action.items} parentIcon={icon} />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    ) : (
      <DropdownMenuItem key={action.id} onSelect={action.onSelect}>
        {icon}
        {action.label}
      </DropdownMenuItem>
    );
  });
}
