import { describe, expect, it } from "vitest";
import { toCreateInput, toTemplateInput } from "./create-input";
import { at, draftFixture } from "./line-fixture";
import { newReview } from "./review-state";

const who = { customerId: "c1", customerName: "Volvo", contactId: "p1", contactName: "Anna" };
const when = { date: "2026-11-20", from: "09:00", to: "12:00", guests: 12 };
const period = { startsAt: at({ hour: 9 }), endsAt: at({ hour: 12 }) };
const options = [
  { itemId: "fish", quantity: 8 },
  { itemId: "wine", quantity: null },
];
const needs = [{ entityTypeId: "rt", vocabularyValueId: "vegan", quantity: 2 }];
const lines = [
  draftFixture({ from: 10, to: 11, options, needs, note: "Window seats" }),
  draftFixture({ key: "l2", name: "Sign", itemId: null, fields: { text: "Welcome" } }),
];
const review = { ...newReview({ lines, plannedStart: null, pickKey: "t1" }), note: "  VIP  " };
const pick = { kind: "PACKAGE", templateId: "t1", name: "Day", answers: {} } as const;
const base = { who, when, period, pick, review, orderTypeId: "tt", intakeKey: "k1" };

describe("toCreateInput", () => {
  it("sends the order, its lines, the package and the key in one call", () => {
    const input = toCreateInput({ ...base, userId: "u1" });
    expect(input).toMatchObject({
      ...{ entityTypeId: "tt", customerId: "c1", contactId: "p1", estimatedHeadcount: 12 },
      ...{ desiredStartsAt: period.startsAt, assigneeId: "u1", note: "VIP" },
      ...{ templateId: "t1", intakeKey: "k1" },
    });
    expect(input.lines?.[0]).toMatchObject({
      startsAt: at({ hour: 10 }),
      note: "Window seats",
      options: [{ itemId: "fish", quantity: 8 }, { itemId: "wine" }],
      requirements: needs,
    });
    expect(input.lines?.[1]).toMatchObject({ startsAt: null, fields: { text: "Welcome" } });
  });

  it("sends add-ons under their line, times only when their own (ADR 0088)", () => {
    const addOn = { itemId: "oat", name: "Oat ball", quantity: null, unitPriceMinor: null };
    const own = {
      ...addOn,
      key: "b",
      startsAt: at({ hour: 10 }).toISOString(),
      endsAt: at({ hour: 11 }).toISOString(),
    };
    const line = draftFixture({
      from: 9,
      to: 12,
      addOns: [{ ...addOn, key: "a", startsAt: null, endsAt: null }, own],
    });
    const input = toCreateInput({ ...base, review: { ...review, lines: [line] }, userId: "u1" });
    expect(input.lines?.[0]?.addOns).toEqual([
      { ...addOn },
      { ...addOn, startsAt: at({ hour: 10 }), endsAt: at({ hour: 11 }) },
    ]);
  });

  it("sends a given title trimmed and leaves an empty one to be generated", () => {
    const titled = toCreateInput({
      ...base,
      review: { ...review, title: " Kick-off " },
      userId: "u1",
    });
    expect(titled.title).toBe("Kick-off");
    const empty = toCreateInput({ ...base, review: { ...review, title: "  " }, userId: "u1" });
    expect(empty).not.toHaveProperty("title");
  });

  it("leaves the package out of a one-off and keeps a chosen assignee", () => {
    const chosen = { ...review, more: { ...review.more, assigneeId: "u2" } };
    const input = toCreateInput({
      ...base,
      pick: { kind: "ONE_OFF" },
      review: chosen,
      userId: "u1",
    });
    expect(input.templateId).toBeUndefined();
    expect(input.assigneeId).toBe("u2");
  });
});

describe("toTemplateInput", () => {
  it("turns lines into offsets from the start; an untimed line spans the order", () => {
    const input = toTemplateInput({
      name: " Day ",
      orderTypeId: "tt",
      statusId: "s",
      review,
      period,
    });
    expect(input.name).toBe("Day");
    expect(
      input.lines.map(({ offsetMinutes, durationMinutes }) => [offsetMinutes, durationMinutes]),
    ).toEqual([
      [60, 60],
      [0, 180],
    ]);
  });
});
