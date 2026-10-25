"use client";

import type { DisplayFormats } from "@bibi/core/schemas";
import { createContext, type ReactNode } from "react";

/** The signed-in user's date, clock and number formats; defaults when nobody is signed in. */
export const DisplayFormatsContext = createContext<DisplayFormats>({
  dateFormat: null,
  clockFormat: null,
  numberFormat: null,
  currencyDisplay: null,
});

export type DisplayFormatsProviderProps = { formats: DisplayFormats; children: ReactNode };

/** Hands the formats the layout loaded (`loadDisplayFormats`) to every client component. */
export function DisplayFormatsProvider({ formats, children }: DisplayFormatsProviderProps) {
  return <DisplayFormatsContext value={formats}>{children}</DisplayFormatsContext>;
}
