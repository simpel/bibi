import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";
import type { CalendarLine } from "../availability-calendar/calendar-types";

/** An issue on a card, said in words as a badge in its header: an error blocks, a warning needs fixing. */
export type CardIssue = {
  key: string;
  level: "error" | "warning";
  label: string;
  /** What it means and what to do, shown when the badge is hovered or focused. */
  detail?: string | undefined;
  /** A clock instead of the warning triangle: a preliminary (tentative) reservation. */
  icon?: "clock" | undefined;
};

/** What needs attention on a card: a block (red) or something to fix (amber). */
export type CardAttention = "error" | "warning" | null;

/**
 * The facts a booking or order card's surface shows (spec: home, Tone). Colour is the order
 * status's (its badge) and attention's:
 * - `following` (the member only follows the order): no fill or shadow, a plain inner edge.
 * - `done` (over): dimmed, no shadow.
 * - `attention`: a dashed border in the colour of the card's badges beside its icons: red when
 *   something blocks it, amber when something needs fixing or the booking is only preliminary.
 * Live is the footer's pulse. A card with no facts is the plain card.
 */
export type CardSurface = {
  following?: boolean;
  done?: boolean;
  attention?: CardAttention | undefined;
};

export const cardSurfaceVariants = cva("", {
  variants: {
    // No fill, so it keeps a plain edge; drawn inside so the header's edge covers it.
    following: {
      true: "border-0 bg-transparent shadow-none inset-ring inset-ring-border",
      false: "border-0",
    },
    done: { true: "opacity-60 shadow-none", false: "" },
  },
  defaultVariants: { following: false, done: false },
});

/** The attention border: dashed, in the colour of the card's badges. */
const ATTENTION_BORDER = {
  error: "border-2 border-dashed border-destructive inset-ring-0",
  warning: "border-2 border-dashed border-warning inset-ring-0",
} as const;

/** The same on a table row: a bar on its first cell (a row has no border of its own). */
const ATTENTION_ROW = {
  error: "[&>td:first-child]:inset-shadow-[5px_0_0_0_var(--destructive)]",
  warning: "[&>td:first-child]:inset-shadow-[5px_0_0_0_var(--warning)]",
} as const;

export type AttentionOfInput = {
  issues?: readonly Pick<CardIssue, "level">[] | undefined;
  blocked?: boolean | undefined;
  /** Only a preliminary (soft) hold: it needs confirming or releasing. */
  tentative?: boolean | undefined;
};

/** Red when something blocks (an error issue, or a hard hold over a soft one), else amber. */
export const attentionOf = ({ issues, blocked, tentative }: AttentionOfInput): CardAttention => {
  if (blocked || issues?.some((issue) => issue.level === "error")) return "error";
  return issues?.length || tentative ? "warning" : null;
};

/** Every card's surface in one call: the cues' classes and the attention border. */
export const cardSurfaceProps = ({ surface }: { surface?: CardSurface | undefined }) => ({
  attention: surface?.attention ?? null,
  className: cn(
    cardSurfaceVariants(surface ?? {}),
    surface?.attention && ATTENTION_BORDER[surface.attention],
  ),
});

/**
 * A table row's surface, the same cues as a card where a row can show them: the attention bar
 * on the first cell and dimmed when over. A row has no fill to drop, so following shows nothing.
 */
export const rowSurfaceProps = ({ surface }: { surface?: CardSurface | undefined }) => ({
  className: cn(
    surface?.attention && ATTENTION_ROW[surface.attention],
    surface?.done && "opacity-60",
  ),
});

export type SurfaceOfLineInput = { line: Pick<CalendarLine, "state" | "issues" | "blocked"> };

/** A calendar booking's surface: amber when only preliminary, red when blocked. */
export const surfaceOfLine = ({ line }: SurfaceOfLineInput): CardSurface => ({
  attention: attentionOf({
    issues: line.issues,
    blocked: line.blocked,
    tentative: line.state.hold === "soft",
  }),
});
