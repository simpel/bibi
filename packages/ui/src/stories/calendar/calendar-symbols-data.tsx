import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { bufferStyle, markStyle } from "./calendar-marks";
import { LineContact, StaffList } from "./calendar-people";
import { GUEST_RULE, GuestMark } from "./guest-mark";
import { PEOPLE } from "./people-data";
import { STATES } from "./states-data";

/** A sample of a mark, as the Symbols page shows it. */
export function Swatch({
  style,
  className = "h-6 w-16",
}: {
  style: CSSProperties;
  className?: string;
}) {
  return <span className={`inline-block rounded-md border ${className}`} style={style} />;
}

/** Every symbol besides the state marks, with what it means. Rendered by the Symbols story. */
export const OTHERS: readonly { symbol: ReactNode; label: string; means: string }[] = [
  {
    symbol: (
      <span className="relative block h-6 w-16 overflow-hidden rounded-md bg-destructive/20">
        <span className="absolute inset-x-0 top-0 h-1 bg-destructive" />
      </span>
    ),
    label: "Red ground, notch",
    means: "A clash: two lines on one asset take the same time, buffers included.",
  },
  {
    symbol: (
      <span className="flex h-6 w-16 items-center gap-1 rounded-md border border-dashed border-muted-foreground/50 px-1.5 text-xs text-muted-foreground">
        + 10:30
      </span>
    ),
    label: "Dashed slot",
    means: "Free time under the pointer: click or tap to add a booking there.",
  },
  {
    symbol: <span className={cn(GUEST_RULE, "block h-1 w-16")} />,
    label: "Ink rule",
    means: "Where the guests are: one place at a time, through the day.",
  },
  {
    symbol: <GuestMark count={24} />,
    label: "People mark",
    means: "A line the guests attend, with the headcount where it helps.",
  },
  {
    symbol: (
      <Swatch className="h-3 w-16 rounded-sm" style={bufferStyle({ state: STATES.prebooked })} />
    ),
    label: "Thin, dotted, faint",
    means: "Setup or teardown of the line it touches. Internal only.",
  },
  {
    symbol: <Swatch style={markStyle({ state: STATES.maintenance, audience: "internal" })} />,
    label: "Grey fill",
    means: "Blocked but not sold: maintenance, internal blocks.",
  },
  {
    symbol: (
      <span className="block h-2 w-16 rounded-t-sm border-x-2 border-t-2 border-muted-foreground/60" />
    ),
    label: "Grey bracket",
    means: "A package: frames its parts, holds nothing itself.",
  },
  {
    symbol: <Swatch style={markStyle({ state: STATES.booked, audience: "external" })} />,
    label: "White card, ink edge",
    means: "What customers see. No states, so no hue.",
  },
  {
    symbol: (
      <Swatch
        className="h-6 w-16 ring-2 ring-foreground ring-offset-2 ring-offset-card"
        style={markStyle({ state: STATES.booked, audience: "internal" })}
      />
    ),
    label: "Ink ring",
    means: "The booking open beside the calendar. Nothing else is ever faded.",
  },
  {
    symbol: <LineContact contact={{ person: PEOPLE.ali, via: "Head of kitchen" }} />,
    label: "Contact",
    means:
      "The one person to reach about the line: name, why them, the number. Hover card and agenda only. Internal only.",
  },
  {
    symbol: <StaffList staff={[PEOPLE.mona]} label={false} />,
    label: "Staff",
    means:
      "Staff working the line: name and role, no number. Hover card and agenda only. Internal only.",
  },
];
