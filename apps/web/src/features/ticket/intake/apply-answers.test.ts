import { describe, expect, it } from "vitest";
import { applyAnswers } from "./apply-answers";
import { entryFixture } from "./entry-fixture";
import { followUpQuestions } from "./follow-up-questions";
import { periodOf } from "./intake-period";

const timeZone = "Europe/Stockholm";
const when = { date: "2026-11-20", from: "09:00", to: "12:00", guests: 40 };

describe("periodOf", () => {
  it("reads the wall times in the organization's zone", () => {
    const period = periodOf({ when, timeZone });
    expect(period?.startsAt.toISOString()).toBe("2026-11-20T08:00:00.000Z");
    expect(period?.endsAt.toISOString()).toBe("2026-11-20T11:00:00.000Z");
  });

  it("ends the next day when to is not after from", () => {
    const period = periodOf({ when: { ...when, from: "20:00", to: "01:00" }, timeZone });
    expect(period?.endsAt.toISOString()).toBe("2026-11-21T00:00:00.000Z");
  });
});

describe("followUpQuestions and applyAnswers", () => {
  const entry = entryFixture({
    group: "OUTSIDE_RANGE",
    issues: [
      { kind: "GUESTS_OUTSIDE_RANGE", minGuests: 10, maxGuests: 30 },
      { kind: "PAST_REQUESTED_END", endsAt: new Date("2026-11-20T12:00:00.000Z") },
    ],
    lineIssues: [["HARD_CLASH"]],
    firstFreeStart: new Date("2026-11-20T12:00:00.000Z"),
  });
  const questions = followUpQuestions({ entry, headcount: 40 });

  it("asks guests, then the end, then the clash", () => {
    expect(questions.map(({ kind }) => kind)).toEqual(["GUESTS", "END", "CLASH"]);
    expect(questions[0]).toEqual({ kind: "GUESTS", guests: 30, raise: false });
  });

  it("lowers the guests, extends the end and moves the whole period", () => {
    const answers = { guests: "CHANGE", end: "EXTEND", clash: "MOVE" } as const;
    expect(applyAnswers({ when, questions, answers, timeZone })).toEqual({
      date: "2026-11-20",
      from: "13:00",
      to: "17:00",
      guests: 30,
    });
  });

  it("changes nothing when every answer keeps", () => {
    const answers = { guests: "KEEP", end: "KEEP", clash: "PREBOOK" } as const;
    expect(applyAnswers({ when, questions, answers, timeZone })).toEqual(when);
  });

  it("raises to the minimum and asks nothing for a fitting package", () => {
    const few = entryFixture({ issues: [{ kind: "GUESTS_OUTSIDE_RANGE", minGuests: 10 }] });
    expect(followUpQuestions({ entry: few, headcount: 4 })).toEqual([
      { kind: "GUESTS", guests: 10, raise: true },
    ]);
    expect(followUpQuestions({ entry: entryFixture({}), headcount: 4 })).toEqual([]);
  });
});
