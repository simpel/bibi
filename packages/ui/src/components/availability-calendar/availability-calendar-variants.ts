import { cva, type VariantProps } from "class-variance-authority";

/**
 * Where the calendar sits. A card in a story or beside other content; the page takes its whole
 * canvas: no frame, and the grid fills the height left under the toolbar and the strip.
 */
export const availabilityCalendarVariants = cva("@container grid min-w-0 gap-3 sm:gap-4", {
  variants: {
    layout: {
      card: "rounded-xl border bg-card p-3 shadow-xs sm:p-5",
      // The grid runs edge to edge; the toolbar, the strip and the names keep the gutter.
      page: "h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] bg-card pt-3 [--gutter:1rem] *:not-last:px-(--gutter) sm:pt-4 sm:[--gutter:1.5rem]",
    },
  },
  defaultVariants: { layout: "card" },
});

/** The grid's height per layout: a card scrolls inside a fixed height, a page fills. */
export const availabilityGridVariants = cva("", {
  variants: { layout: { card: "max-h-[36rem]", page: "h-full min-h-0" } },
  defaultVariants: { layout: "card" },
});

export type AvailabilityCalendarLayout = VariantProps<typeof availabilityCalendarVariants>;
