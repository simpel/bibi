import { cva, type VariantProps } from "class-variance-authority";
import type { CalendarLine } from "../availability-calendar/calendar-types";

/**
 * A striped outline for a card with an issue: a 2px ring of stripes drawn by a masked
 * `::before`, so it keeps the card's radius and works over translucent backgrounds.
 */
const STRIPED =
  "relative border-transparent before:pointer-events-none before:absolute before:inset-0 before:z-20 before:rounded-[inherit] before:p-0.5 before:content-[''] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] before:[background:repeating-linear-gradient(135deg,var(--stripe)_0_6px,transparent_6px_10px)]";

/**
 * The state a booking or order card is in, carried by its outline so every card reads the same:
 * `conflict` (blocked by another hold or a need match) and `action` (the viewer has something to
 * do) as a striped outline; a card in a normal state has no outline, its header's wash carries
 * it: `live` (happening now), `tentative` (soft holds only: dashed and hatched, as on the
 * calendar), `confirmed`, `done` (over, dimmed) and `following` (told, not asked: lighter).
 */
export const bookingToneVariants = cva("", {
  variants: {
    tone: {
      conflict: `${STRIPED} [--stripe:var(--destructive)]`,
      action: `${STRIPED} [--stripe:var(--warning)]`,
      live: "border-transparent",
      tentative:
        "border-dashed border-muted-foreground/60 shadow-none bg-[repeating-linear-gradient(135deg,transparent_0_7px,var(--muted)_7px_8px)]",
      confirmed: "border-transparent",
      done: "border-transparent opacity-60 shadow-none",
      following: "bg-transparent shadow-none",
    },
  },
  defaultVariants: { tone: "confirmed" },
});

export type BookingTone = NonNullable<VariantProps<typeof bookingToneVariants>["tone"]>;

/** The same state as a subtle wash behind a card's header, edge to edge. */
export const bookingTintVariants = cva("", {
  variants: {
    tone: {
      conflict: "bg-destructive/10",
      action: "bg-warning/15",
      live: "bg-success/10",
      tentative: "bg-muted-foreground/10",
      confirmed: "bg-muted/70",
      done: "bg-muted/70",
      following: "bg-transparent",
    } satisfies Record<BookingTone, string>,
  },
  defaultVariants: { tone: "confirmed" },
});

export type ToneOfLineInput = { line: Pick<CalendarLine, "state" | "blocked"> };

/** A calendar booking's tone: blocked by a hard hold is a conflict, soft is tentative. */
export const toneOfLine = ({ line }: ToneOfLineInput): BookingTone =>
  line.blocked ? "conflict" : line.state.hold === "soft" ? "tentative" : "confirmed";
