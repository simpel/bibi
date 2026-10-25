import type { HoursRow } from "../lib/hours";
import type { ExceptionRow } from "../lib/hours-exceptions";

/** The values of every hours form; the welcome step keeps `exceptions` empty. */
export type HoursValues = { rows: HoursRow[]; exceptions: ExceptionRow[] };
