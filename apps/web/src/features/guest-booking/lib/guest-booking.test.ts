import { describe, expect, it } from "vitest";
import type { ActionError } from "@/lib/action-result";
import { bookingPinOfPath } from "./booking-path";
import { parseDay, parseParty } from "./booking-query";
import { frameAncestors } from "./frame-ancestors";
import { groupSlots } from "./group-slots";
import { guestErrorKey } from "./guest-error";
import { emailHint, pickText } from "./guest-text";
import { todayIn } from "./today-in";

const at = ({ iso }: { iso: string }) => new Date(iso);
const formatTime = ({ instant }: { instant: Date }) => instant.toISOString().slice(11, 16);

describe("groupSlots", () => {
  it("groups by sitting in order of the first time, times ascending", () => {
    const groups = groupSlots({
      formatTime,
      slots: [
        { startsAt: at({ iso: "2026-12-04T18:30:00Z" }), serviceName: "Dinner" },
        { startsAt: at({ iso: "2026-12-04T11:00:00Z" }), serviceName: "Lunch" },
        { startsAt: at({ iso: "2026-12-04T18:00:00Z" }), serviceName: "Dinner" },
      ],
    });
    expect(groups).toEqual([
      { name: "Lunch", slots: [{ startsAt: "2026-12-04T11:00:00.000Z", time: "11:00" }] },
      {
        name: "Dinner",
        slots: [
          { startsAt: "2026-12-04T18:00:00.000Z", time: "18:00" },
          { startsAt: "2026-12-04T18:30:00.000Z", time: "18:30" },
        ],
      },
    ]);
  });

  it("has no groups without slots", () => {
    expect(groupSlots({ formatTime, slots: [] })).toEqual([]);
  });
});

describe("frameAncestors", () => {
  it("allows only this app without origins", () => {
    expect(frameAncestors({ origins: [] })).toBe("frame-ancestors 'self'");
  });

  it("adds exact https origins once and drops anything else", () => {
    const origins = [
      "https://worldofvolvo.com",
      "https://worldofvolvo.com",
      "http://insecure.se",
      "https://site.se/path",
      "https://a.se; script-src *",
      "nonsense",
    ];
    expect(frameAncestors({ origins })).toBe("frame-ancestors 'self' https://worldofvolvo.com");
  });
});

describe("booking query", () => {
  it("takes a party within the online limit, else two (or the limit)", () => {
    expect(parseParty({ value: "4", max: 8 })).toBe(4);
    expect(parseParty({ value: "9", max: 8 })).toBe(2);
    expect(parseParty({ value: "x", max: 8 })).toBe(2);
    expect(parseParty({ value: undefined, max: 1 })).toBe(1);
  });

  it("takes a real day from today on, else today", () => {
    const today = "2026-11-27";
    expect(parseDay({ value: "2026-12-04", today })).toBe("2026-12-04");
    expect(parseDay({ value: "2026-11-01", today })).toBe(today);
    expect(parseDay({ value: "2026-02-30", today })).toBe(today);
    expect(parseDay({ value: undefined, today })).toBe(today);
  });

  it("reads today in the room's zone", () => {
    const now = at({ iso: "2026-11-27T23:30:00Z" });
    expect(todayIn({ timeZone: "Europe/Stockholm", now })).toBe("2026-11-28");
    expect(todayIn({ timeZone: "UTC", now })).toBe("2026-11-27");
  });
});

describe("guest texts", () => {
  it("prefers the visitor's language and falls back to the other", () => {
    expect(pickText({ texts: { sv: "Välkommen", en: "Welcome" }, locale: "en" })).toBe("Welcome");
    expect(pickText({ texts: { sv: "Välkommen" }, locale: "en" })).toBe("Välkommen");
    expect(pickText({ texts: { en: " " }, locale: "sv" })).toBeNull();
  });

  it("hints at the email address without spelling it out", () => {
    expect(emailHint({ email: "anna@volvo.se" })).toBe("a…@volvo.se");
    expect(emailHint({ email: "broken" })).toBe("…");
  });
});

describe("bookingPinOfPath", () => {
  it("reads the slug or the manage token of a booking page", () => {
    expect(bookingPinOfPath({ pathname: "/sv/book/lindholmen-demo" })).toEqual({
      slug: "lindholmen-demo",
    });
    expect(bookingPinOfPath({ pathname: "/en/book/lindholmen-demo/kajen" })).toEqual({
      slug: "lindholmen-demo",
    });
    expect(bookingPinOfPath({ pathname: "/en/book/manage/abc123" })).toEqual({ token: "abc123" });
  });

  it("ignores other paths", () => {
    for (const pathname of ["/sv/pay/x", "/book/x", "/de/book/x", "/sv/book", "/sv/book/manage"]) {
      expect(bookingPinOfPath({ pathname })).toBeNull();
    }
  });
});

describe("guestErrorKey", () => {
  const error = ({
    code,
    message = "",
    issues = [],
  }: {
    code: ActionError["code"];
    message?: string;
    issues?: ActionError["issues"];
  }) => ({ error: { code, message, issues } });

  it("tells a taken time from a passed cutoff, and names the captcha", () => {
    expect(
      guestErrorKey(error({ code: "CONFLICT", message: "That time is no longer available" })),
    ).toBe("taken");
    expect(
      guestErrorKey(
        error({
          code: "CONFLICT",
          message: "It is too late to change this booking",
          issues: [{ path: "changeUntil", message: "late" }],
        }),
      ),
    ).toBe("late");
    const captcha = [{ path: "captcha", message: "failed" }];
    expect(guestErrorKey(error({ code: "VALIDATION", message: "failed", issues: captcha }))).toBe(
      "captcha",
    );
    expect(guestErrorKey(error({ code: "NOT_FOUND" }))).toBe("notFound");
    expect(guestErrorKey(error({ code: "INTERNAL" }))).toBeNull();
  });
});
