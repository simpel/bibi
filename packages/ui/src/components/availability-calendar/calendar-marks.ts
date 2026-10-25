import type { CSSProperties } from "react";
import type { CalendarAudience, CalendarState } from "./calendar-types";

/*
 * The calendar's symbol vocabulary. Each visual property carries exactly one meaning:
 * - Hue      = the line's state, and nothing else. Never brand, never chrome, never a person.
 * - Fill     = the hold: solid blocks, hatched may overlap, a plain tint holds nothing (ADR 0044).
 * - Edge     = solid for hard, dashed for soft and none, dotted for setup and teardown.
 * - Grey fill = blocked but not sold (maintenance, internal blocks). Grey lines and text are
 *              structure: package frames, grid, chrome.
 * - External = a white card with an ink outline: customers never see states, so never a hue.
 * - Focus    = the ticket in focus gets an ink ring; the rest is lowered but keeps its hue.
 */

const mix = ({ color, percent }: { color: string; percent: number }) =>
  `color-mix(in oklch, ${color} ${percent}%, transparent)`;

const hatch = ({ color }: { color: string }) =>
  `repeating-linear-gradient(135deg, ${mix({ color, percent: 32 })} 0 5px, ${mix({ color, percent: 10 })} 5px 10px)`;

/**
 * What a customer sees: a plain card with an ink outline. No state hue (they never see states)
 * and no grey fill (grey reads as blocked or disabled).
 */
const EXTERNAL_MARK: CSSProperties = {
  backgroundColor: "var(--card)",
  borderColor: "color-mix(in oklch, var(--foreground) 45%, transparent)",
  color: "var(--foreground)",
};

/** The booking mark: hue from the state, fill and edge from its hold. */
export function markStyle({
  state,
  audience,
}: {
  state: CalendarState;
  audience: CalendarAudience;
}): CSSProperties {
  if (audience === "external") return EXTERNAL_MARK;
  if (state.hold === "hard") {
    return { backgroundColor: state.color, borderColor: state.color, color: state.ink };
  }
  if (state.hold === "soft") {
    return {
      backgroundImage: hatch({ color: state.color }),
      borderColor: state.color,
      borderStyle: "dashed",
      color: "var(--foreground)",
    };
  }
  return {
    backgroundColor: mix({ color: state.color, percent: 10 }),
    borderColor: state.color,
    borderStyle: "dashed",
    color: "var(--foreground)",
  };
}

/** Setup and teardown (ADR 0059): the line's hue, faint, thinner and dotted. Internal only. */
export function bufferStyle({ state }: { state: CalendarState }): CSSProperties {
  return {
    backgroundColor: mix({ color: state.color, percent: 14 }),
    borderColor: mix({ color: state.color, percent: 70 }),
    borderStyle: "dotted",
  };
}

/** The same mark shrunk to a dot for lists: hue = state, fill and edge = hold. */
export function dotStyle({
  state,
  audience,
}: {
  state: CalendarState;
  audience: CalendarAudience;
}): CSSProperties {
  if (audience === "external") return { backgroundColor: "var(--foreground)" };
  if (state.hold === "hard") return { backgroundColor: state.color };
  if (state.hold === "soft") {
    return {
      backgroundImage: hatch({ color: state.color }),
      border: `1.5px dashed ${state.color}`,
    };
  }
  return {
    backgroundColor: mix({ color: state.color, percent: 10 }),
    border: `1.5px dashed ${state.color}`,
  };
}
