import { describe, expect, it } from "vitest";
import { type CardToneInput, cardTone } from "./card-tone";

const now = new Date("2037-11-01T10:00:00Z");
const base: CardToneInput["card"] = {
  startsAt: "2037-11-01T12:00:00Z",
  endsAt: "2037-11-01T14:00:00Z",
  hold: "HARD",
  reasons: ["ASSIGNEE"],
  flags: [],
};
const tone = ({ ...card }: Partial<CardToneInput["card"]>) =>
  cardTone({ card: { ...base, ...card }, now });

describe("cardTone (spec: home)", () => {
  it("puts a clash or a blocked run sheet first, even for a follower", () => {
    expect(
      tone({ reasons: ["FOLLOWER"], flags: [{ kind: "HARD_CLASH", runSheetStatus: null }] }),
    ).toBe("conflict");
    expect(tone({ flags: [{ kind: "RUN_SHEET", runSheetStatus: "BLOCKED" }] })).toBe("conflict");
  });

  it("asks only a member who acts", () => {
    const flags = [{ kind: "QUOTE_WAITING" as const, runSheetStatus: null }];
    expect(tone({ flags })).toBe("action");
    expect(tone({ reasons: ["FOLLOWER"], flags })).toBe("following");
  });

  it("follows the clock: live inside the span, done after it", () => {
    expect(tone({ startsAt: "2037-11-01T09:00:00Z" })).toBe("live");
    expect(tone({ startsAt: "2037-11-01T07:00:00Z", endsAt: "2037-11-01T09:00:00Z" })).toBe("done");
  });

  it("is tentative on soft holds only, else confirmed", () => {
    expect(tone({ hold: "SOFT" })).toBe("tentative");
    expect(tone({ hold: null })).toBe("confirmed");
  });
});
