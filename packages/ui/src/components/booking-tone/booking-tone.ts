import { cva, type VariantProps } from "class-variance-authority";
import type { CalendarLine } from "../availability-calendar/calendar-types";

/**
 * The state a booking or order card is in, the same on every card. Issues are said in words as
 * badges in the header (`CardIssue`), never by the outline: `conflict` and `action` have no outline,
 * like `live`, `confirmed` and `done` (over, dimmed); `tentative` (soft holds only) is dashed and
 * hatched as on the calendar and `following` (told, not asked) keeps a plain inner edge.
 */
export const bookingToneVariants = cva("", {
  variants: {
    tone: {
      conflict: "border-0",
      action: "border-0",
      live: "border-0",
      tentative:
        "border-dashed border-muted-foreground/60 shadow-none bg-[repeating-linear-gradient(135deg,transparent_0_7px,var(--muted)_7px_8px)]",
      confirmed: "border-0",
      done: "border-0 opacity-60 shadow-none",
      // No fill, so it keeps a plain edge; drawn inside so the header's edge covers it.
      following: "border-0 inset-ring inset-ring-border bg-transparent shadow-none",
    },
  },
  defaultVariants: { tone: "confirmed" },
});

export type BookingTone = NonNullable<VariantProps<typeof bookingToneVariants>["tone"]>;

export type ToneOfLineInput = { line: Pick<CalendarLine, "state" | "blocked"> };

/** A calendar booking's tone: blocked by a hard hold is a conflict, soft is tentative. */
export const toneOfLine = ({ line }: ToneOfLineInput): BookingTone =>
  line.blocked ? "conflict" : line.state.hold === "soft" ? "tentative" : "confirmed";

/** An issue on a card, said in words as a badge in its header: an error blocks, a warning needs fixing. */
export type CardIssue = { key: string; level: "error" | "warning"; label: string };
