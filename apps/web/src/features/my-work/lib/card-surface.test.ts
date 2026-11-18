import { describe, expect, it } from "vitest";
import { type CardSurfaceInput, cardSurface, isLive } from "./card-surface";

const now = new Date("2037-11-01T10:00:00Z");
const base: CardSurfaceInput["card"] = {
  startsAt: "2037-11-01T12:00:00Z",
  endsAt: "2037-11-01T14:00:00Z",
  hold: "HARD",
  reasons: ["ASSIGNEE"],
};
const surface = ({ ...card }: Partial<CardSurfaceInput["card"]>) =>
  cardSurface({ card: { ...base, ...card }, now });

describe("cardSurface (spec: home, Tone)", () => {
  it("is the plain card for owned, hard-held work ahead", () => {
    expect(surface({})).toEqual({ following: false, done: false });
  });

  it("is following only for an order the member chose to follow, not for work by default", () => {
    expect(surface({ reasons: ["FOLLOWER"] }).following).toBe(true);
    expect(surface({ reasons: ["RESPONSIBILITY_FOLLOWER"] }).following).toBe(false);
    expect(surface({ reasons: ["FOLLOWER", "RECIPIENT"] }).following).toBe(false);
  });

  it("is done once the span is over", () => {
    expect(surface({ startsAt: "2037-11-01T07:00:00Z", endsAt: "2037-11-01T09:00:00Z" }).done).toBe(
      true,
    );
  });

  it("combines the facts: a followed order is following, an old one also done", () => {
    expect(surface({ hold: "SOFT", reasons: ["FOLLOWER"] })).toEqual({
      following: true,
      done: false,
    });
    expect(
      surface({
        hold: "SOFT",
        reasons: ["FOLLOWER"],
        startsAt: "2037-11-01T07:00:00Z",
        endsAt: "2037-11-01T09:00:00Z",
      }),
    ).toEqual({ following: true, done: true });
  });
});

describe("isLive", () => {
  it("is live only inside the span", () => {
    expect(isLive({ card: { ...base, startsAt: "2037-11-01T09:00:00Z" }, now })).toBe(true);
    expect(isLive({ card: base, now })).toBe(false);
  });
});
