import { cva, type VariantProps } from "class-variance-authority";
import type { CalendarLine } from "../availability-calendar/calendar-types";

/**
 * The state a booking or order card is in, the same on every card. The header carries the status
 * colour and an issue is said with an icon (`issueOfTone`), never by the outline: `conflict`
 * (blocked: an error icon) and `action` (something to fix: a warning triangle) have no outline,
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

export type CardIssue = "error" | "warning";

/** The issue icon a tone shows in a card's header: blocked is an error, to fix a warning. */
export const issueOfTone = ({ tone }: { tone: BookingTone | undefined }): CardIssue | null =>
  tone === "conflict" ? "error" : tone === "action" ? "warning" : null;
