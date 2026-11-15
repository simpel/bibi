import { cva, type VariantProps } from "class-variance-authority";
import type { CalendarHold } from "../availability-calendar/calendar-types";

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

/** The tone a booking has from its hold alone: soft is tentative, anything else confirmed. */
export const toneOfHold = ({ hold }: { hold: CalendarHold | undefined }): BookingTone =>
  hold === "soft" ? "tentative" : "confirmed";
