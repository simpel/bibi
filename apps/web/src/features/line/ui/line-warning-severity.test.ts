import { describe, expect, it } from "vitest";
import { bySeverity } from "./line-warning-severity";

describe("bySeverity", () => {
  it("puts an open required choice before closed hours", () => {
    const warnings = [
      { id: "venue", kind: "OUTSIDE_VENUE_HOURS" as const },
      { id: "group", kind: "UNCHOSEN_REQUIRED_GROUP" as const },
    ];
    expect(bySeverity({ warnings }).map(({ kind }) => kind)).toEqual([
      "UNCHOSEN_REQUIRED_GROUP",
      "OUTSIDE_VENUE_HOURS",
    ]);
  });
});
