import { ContextMenu as MenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import {
  MENU_CONTENT_CLASS,
  MENU_SEPARATOR_CLASS,
  menuItemClass,
} from "../dropdown-menu/menu-styles";

/** A menu on right click (or long press), styled like `DropdownMenu`. */
export const ContextMenu = MenuPrimitive.Root;
export const ContextMenuTrigger = MenuPrimitive.Trigger;

export function ContextMenuContent({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(MENU_CONTENT_CLASS, className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

export type ContextMenuItemProps = ComponentProps<typeof MenuPrimitive.Item> & {
  destructive?: boolean;
};

export function ContextMenuItem({ className, destructive, ...props }: ContextMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="context-menu-item"
      className={cn(menuItemClass({ destructive }), className)}
      {...props}
    />
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(MENU_SEPARATOR_CLASS, className)}
      {...props}
    />
  );
}
