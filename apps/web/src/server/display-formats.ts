import "server-only";
import { type DisplayFormats, getUserSettings } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { runOperation } from "./run-operation";

const DEFAULTS: DisplayFormats = {
  dateFormat: null,
  clockFormat: null,
  numberFormat: null,
  currencyDisplay: null,
};

/**
 * The signed-in user's date, clock and number formats (ADR 0046, #482), once per request. Signed out (the
 * public payment page) or on any error every time renders in the defaults, so this never
 * throws (Next's own control-flow errors are rethrown).
 */
export const loadDisplayFormats = cache(async (): Promise<DisplayFormats> => {
  try {
    const result = await runOperation({ operation: getUserSettings, input: {} });
    if (!result.ok) return DEFAULTS;
    const { dateFormat, clockFormat, numberFormat, currencyDisplay } = result.value;
    return { dateFormat, clockFormat, numberFormat, currencyDisplay };
  } catch (error) {
    unstable_rethrow(error);
    getLogger().warn({ event: "userSettings.loadFailed", err: error });
    return DEFAULTS;
  }
});
