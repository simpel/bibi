import fatalEn from "../messages/en/fatal.json";
import fatalSv from "../messages/sv/fatal.json";
import type { Locale } from "./routing";

export type FatalMessages = typeof fatalSv;

/**
 * Only the `fatal` namespace, for `global-error.tsx`: it replaces the root layout and its message
 * provider, and importing the full catalog would ship every bundle to every client. It is kept out
 * of the typed catalog (`svMessages`), whose type is at TypeScript's complexity limit; its sv/en key
 * parity has its own case in `check-messages.test.ts`.
 */
export const FATAL_MESSAGES: Record<Locale, FatalMessages> = { sv: fatalSv, en: fatalEn };
