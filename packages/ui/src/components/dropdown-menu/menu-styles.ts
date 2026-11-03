import { cn } from "../../lib/cn";

/** The floating panel of a dropdown or context menu. */
export const MENU_CONTENT_CLASS =
  "z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95";

/** One item of a dropdown or context menu; a destructive one is red. */
export const menuItemClass = ({ destructive }: { destructive?: boolean }) =>
  cn(
    "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    destructive && "text-destructive focus:bg-destructive/10 focus:text-destructive",
  );

/** The rule between groups of items. */
export const MENU_SEPARATOR_CLASS = "-mx-1 my-1 h-px bg-border";
