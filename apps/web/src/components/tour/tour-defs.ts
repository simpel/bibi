import type { HelpHintId } from "../help/help-hints";

/**
 * The page tours (spec: page tours). A tour is the steps below, in order; each step points at the
 * element marked `data-tour="<tour>.<step>"` (or `selector` for one that cannot carry the mark).
 * A step whose element is not on the page (a section the caller may not see) is skipped. Texts are
 * `tour.<tour>.<step>.title|body` in `common.json`.
 */
export const TOURS = {
  "my-work": { hint: "tour-my-work", steps: ["search", "timeline"] },
  calendar: { hint: "tour-calendar", steps: ["toolbar", "grid"] },
  pipeline: { hint: "tour-pipeline", steps: ["toolbar", "board"] },
  order: { hint: "tour-order", steps: ["status", "program", "needs", "details", "money"] },
  "admin-pipeline": { hint: "tour-admin-pipeline", steps: ["flow", "grid"] },
  permissions: { hint: "tour-permissions", steps: ["preset", "grid"] },
  "item-type": { hint: "tour-item-type", steps: ["sections"] },
  "run-sheet-definition": { hint: "tour-run-sheet-definition", steps: ["build"] },
  "board-customize": { hint: "tour-board-customize", steps: ["columns"] },
  "run-sheet": {
    hint: "tour-run-sheet",
    steps: ["facts", "status", "tasks", "needs", "versions"],
  },
} as const satisfies Record<string, { hint: HelpHintId; steps: readonly string[] }>;

export type TourId = keyof typeof TOURS;

/** Steps whose element cannot carry a `data-tour` mark (it lives in a shared component). */
export const TOUR_SELECTORS: Partial<Record<string, string>> = {
  "calendar.toolbar": '[data-slot="calendar-toolbar"]',
  "calendar.grid": '[data-slot="calendar-grid"]',
};

/** The tour of a page, from its path below the organization slug. */
export function tourForPath({
  pathname,
  customize = false,
}: {
  pathname: string;
  /** `/pipeline?mode=customize`: the board's settings, with a tour of its own. */
  customize?: boolean;
}): TourId | null {
  if (pathname === "/" || pathname === "/my-work" || pathname.startsWith("/my-work/")) {
    return "my-work";
  }
  if (pathname === "/calendar" || pathname.startsWith("/calendar/")) return "calendar";
  if (pathname === "/pipeline") return customize ? "board-customize" : "pipeline";
  if (pathname === "/admin/pipeline") return "admin-pipeline";
  if (/^\/admin\/(members|api-keys)\/[^/]+\/permissions$/.test(pathname)) return "permissions";
  if (/^\/admin\/types\/[^/]+$/.test(pathname)) return "item-type";
  if (pathname === "/new/run-sheet") return "run-sheet-definition";
  if (/^\/orders\/[^/]+$/.test(pathname)) return "order";
  if (/^\/run-sheets\/[^/]+$/.test(pathname)) return "run-sheet";
  return null;
}
