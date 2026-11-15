import { cva, type VariantProps } from "class-variance-authority";
import type { CalendarLine } from "../availability-calendar/calendar-types";

/**
 * The state a booking or order card is in, carried by its outline so every card reads the same:
 * `conflict` (blocked by another hold or a need match), `action` (the viewer has something to
 * do), `live` (happening now), `tentative` (soft holds only: dashed and hatched, as on the
 * calendar), `confirmed`, `done` (over, dimmed) and `following` (told, not asked: lighter).
 */
export const bookingToneVariants = cva("", {
  variants: {
    tone: {
      conflict: "border-destructive ring-1 ring-destructive",
      action: "border-warning ring-1 ring-warning",
      live: "border-success",
      tentative:
        "border-dashed border-muted-foreground/60 shadow-none bg-[repeating-linear-gradient(135deg,transparent_0_7px,var(--muted)_7px_8px)]",
      confirmed: "",
      done: "opacity-60 shadow-none",
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
