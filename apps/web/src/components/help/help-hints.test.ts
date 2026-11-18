import { USER_PREFERENCE_KEY_PATTERN } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { dismissedHints, HELP_HINT_IDS, helpDismissedKey } from "./help-hints";

describe("help hints", () => {
  it("stores every hint under a valid preference key", () => {
    for (const id of HELP_HINT_IDS) {
      expect(helpDismissedKey({ id })).toMatch(USER_PREFERENCE_KEY_PATTERN);
    }
  });

  it("reads only hints dismissed with true", () => {
    const preferences = { "help.dismissed.card-legend": true, "help.dismissed.other": true };
    expect(dismissedHints({ preferences })).toEqual(["card-legend"]);
    expect(dismissedHints({ preferences: { "help.dismissed.card-legend": false } })).toEqual([]);
  });
});
