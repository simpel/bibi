import type { ReactNode } from "react";
import { markStyle } from "../../components/availability-calendar/calendar-marks";
import type {
  CalendarHold,
  CalendarState,
} from "../../components/availability-calendar/calendar-types";
import { OTHERS, Swatch } from "./calendar-symbols-data";
import { STAGE_COLORS } from "./states-data";

const HOLDS: readonly { hold: CalendarHold; label: string; means: string }[] = [
  { hold: "hard", label: "Solid", means: "Hard hold: blocks the space" },
  { hold: "soft", label: "Hatched, dashed edge", means: "Soft hold: may overlap, expires" },
  { hold: "none", label: "Tint, dashed edge", means: "No hold: planned, holds nothing" },
];

const STAGES = [
  { key: "tentative", label: "Amber", means: "Tentative: Prebooked, Estimated, Planned" },
  { key: "ordered", label: "Blue", means: "Ordered" },
  { key: "confirmed", label: "Green", means: "Confirmed: Booked, Locked, Confirmed" },
] as const;

function Cell({ children }: { children: ReactNode }) {
  return <div className="flex items-center border-t px-3 py-3 text-sm">{children}</div>;
}

/** Hue (rows) × hold (columns): every booking mark there is, and nothing else. */
function MarkMatrix() {
  return (
    <div className="grid grid-cols-[14rem_repeat(3,1fr)] overflow-hidden rounded-xl border bg-card">
      <span className="px-3 py-2 text-xs font-medium text-muted-foreground">
        Hue = the state's stage
      </span>
      {HOLDS.map((hold) => (
        <span key={hold.hold} className="px-3 py-2 text-xs text-muted-foreground">
          <span className="block font-medium text-foreground">{hold.label}</span>
          {hold.means}
        </span>
      ))}
      {STAGES.map((stage) => (
        <div key={stage.key} className="contents">
          <Cell>
            <span>
              <span className="block font-medium">{stage.label}</span>
              <span className="text-xs text-muted-foreground">{stage.means}</span>
            </span>
          </Cell>
          {HOLDS.map(({ hold }) => {
            const state: CalendarState = { name: stage.key, ...STAGE_COLORS[stage.key], hold };
            return (
              <Cell key={hold}>
                <Swatch style={markStyle({ state, audience: "internal" })} />
              </Cell>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** The whole vocabulary on one page. Anything not on it does not belong on a calendar. */
export function CalendarSymbols() {
  return (
    <div className="grid max-w-5xl gap-8 font-sans">
      <div>
        <h2 className="font-serif text-3xl font-light text-black dark:text-white">Symbols</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Hue says how far a line has come. Fill and edge say what it holds. Everything else is grey
          or ink. A symbol means the same thing in every calendar component.
        </p>
        <p className="mt-3 max-w-2xl text-sm">
          <span className="font-medium">The palette is fixed.</span>{" "}
          <span className="text-muted-foreground">
            Each state picks one of the three stages below, not a color. Three hues stay apart at a
            glance, in light and dark mode, and fill keeps them apart for color-blind readers.
          </span>
        </p>
      </div>
      <MarkMatrix />
      <div className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-[8rem_12rem_1fr]">
        {OTHERS.map((other) => (
          <div key={other.label} className="contents">
            <Cell>{other.symbol}</Cell>
            <Cell>
              <span className="font-medium">{other.label}</span>
            </Cell>
            <Cell>
              <span className="text-muted-foreground">{other.means}</span>
            </Cell>
          </div>
        ))}
      </div>
    </div>
  );
}
