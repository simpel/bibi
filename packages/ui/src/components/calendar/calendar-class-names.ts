import { getDefaultClassNames } from "react-day-picker";
import { cn } from "../../lib/cn";
import { buttonVariants } from "../button/button";

const navButton = cn(buttonVariants({ variant: "ghost" }), "size-(--cell-size) p-0 select-none");

/** The shadcn calendar look on top of react-day-picker's default class names. */
export function calendarClassNames() {
  const base = getDefaultClassNames();
  return {
    root: cn("w-fit", base.root),
    months: cn("relative flex flex-col gap-4 md:flex-row", base.months),
    month: cn("flex w-full flex-col gap-4", base.month),
    nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between", base.nav),
    button_previous: cn(navButton, "aria-disabled:opacity-50", base.button_previous),
    button_next: cn(navButton, "aria-disabled:opacity-50", base.button_next),
    month_caption: cn(
      "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
      base.month_caption,
    ),
    caption_label: cn("text-sm font-medium select-none", base.caption_label),
    month_grid: cn("w-full border-collapse", base.month_grid),
    weekdays: cn("flex", base.weekdays),
    weekday: cn(
      "flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none",
      base.weekday,
    ),
    week: cn("mt-2 flex w-full", base.week),
    day: cn("group/day relative aspect-square h-full w-full p-0 text-center select-none", base.day),
    range_start: cn("rounded-l-md bg-accent", base.range_start),
    range_middle: cn("rounded-none", base.range_middle),
    range_end: cn("rounded-r-md bg-accent", base.range_end),
    today: cn("rounded-md bg-accent text-accent-foreground", base.today),
    outside: cn("text-muted-foreground aria-selected:text-muted-foreground", base.outside),
    disabled: cn("text-muted-foreground opacity-50", base.disabled),
    hidden: cn("invisible", base.hidden),
  };
}
