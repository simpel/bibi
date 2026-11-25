import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
import { collapseSingleChoice, type TitleRowAction } from "./header-action";
import { HeaderActionItems } from "./header-action-items";

export type HeaderActionButtonProps = {
  action: TitleRowAction;
  variant: "default" | "outline";
  /** Only the icon, with the label as its name and tooltip (a header short on width). */
  iconOnly?: boolean;
};

/**
 * One action as a button, or as a button that opens its menu. One icon per button (no chevron),
 * and a single choice runs directly instead of opening a menu.
 */
export function HeaderActionButton({
  action: raw,
  variant,
  iconOnly = false,
}: HeaderActionButtonProps) {
  const action = collapseSingleChoice({ action: raw });
  const compact = iconOnly || raw.overflow === true;
  const content = compact ? (
    raw.icon
  ) : (
    <>
      {raw.icon}
      {action.label}
    </>
  );
  const shape = compact ? ({ size: "icon", "aria-label": action.label } as const) : {};
  if (!action.items) {
    return (
      <Button type="button" variant={variant} onClick={action.onSelect} {...shape}>
        {content}
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={variant} {...shape}>
          {content}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <HeaderActionItems actions={action.items} parentIcon={raw.icon} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
