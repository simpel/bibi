import { afterEach, describe, expect, it } from "vitest";
import { setExtract } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { draft, draftSetup, EMPTY_DRAFT, mockModel, said, time } from "./order-draft-helpers";

afterEach(() => setExtract({ extract: undefined }));

const REQUEST =
  "Hi! A wine tasting for 14 people on Friday 21 November, around 15:00. " +
  "Two of us are vegan, one keeps kosher. /Anna Berg, anna@hisingenenergi.se";

const NOV_2 = new Date("2026-11-02T09:00:00Z");

const answer = {
  ...EMPTY_DRAFT,
  senderName: said({ value: "Anna Berg" }),
  email: said({ value: "anna@hisingenenergi.se" }),
  date: {
    asWritten: "21 November",
    year: null,
    month: 11,
    day: 21,
    ...said({ value: "21 November" }),
  },
  start: time({ value: "15:00", quote: "around 15:00" }),
  end: time({ value: "17:00", quote: "", guessed: true }),
  headcount: { value: 14, quote: "14 people", guessed: false },
  packageName: said({ value: "wine TASTING", quote: "A wine tasting" }),
  needs: [
    { count: 2, ...said({ value: "Vegan", quote: "Two of us are vegan" }) },
    { count: 1, ...said({ value: "Kosher", quote: "one keeps kosher" }) },
  ],
};

describe("orderDraft.fromMessage (ADR 0084)", () => {
  it("reads a draft with evidence and resolves ids, times and choices in core", async () => {
    const setup = await draftSetup();
    const calls = mockModel({ answer });
    const result = unwrap({
      result: await draft({ context: setup.context, input: { text: REQUEST }, now: NOV_2 }),
    });
    expect(result.customerId).toBe(setup.customer.id);
    expect(result.contactId).toBe(setup.contact.id);
    expect(result.templateId).toBe(setup.templateId);
    expect(result.package).toMatchObject({ value: "Wine tasting", guessed: false });
    expect(result.date?.value).toBe("2026-11-21");
    expect(result.start?.value.toISOString()).toBe("2026-11-21T14:00:00.000Z");
    expect(result.end).toMatchObject({ guessed: true });
    expect(result.end?.value.toISOString()).toBe("2026-11-21T16:00:00.000Z");
    expect(result.headcount).toEqual({ value: 14, quote: "14 people", guessed: false });
    expect(result.needs).toEqual([
      {
        value: "Vegan",
        count: 2,
        vocabularyValueId: setup.values.Vegan,
        quote: "Two of us are vegan",
        guessed: false,
      },
      {
        value: "Kosher",
        count: 1,
        vocabularyValueId: null,
        quote: "one keeps kosher",
        guessed: false,
      },
    ]);
    expect(result.timeZone).toBe("Europe/Stockholm");
    const [call] = calls;
    expect(call?.feature).toBe("order.intakeDraft");
    expect(call?.prompt).toContain("Wine tasting");
    expect(call?.prompt).toContain("Vegan");
    expect(call?.prompt).not.toContain(setup.templateId);
  });

  it("marks a value guessed when its quote is not in the message", async () => {
    const setup = await draftSetup();
    mockModel({
      answer: { ...EMPTY_DRAFT, wish: said({ value: "A dinner", quote: "a dinner for us" }) },
    });
    const result = unwrap({
      result: await draft({ context: setup.context, input: { text: REQUEST } }),
    });
    expect(result.wish).toEqual({ value: "A dinner", quote: "a dinner for us", guessed: true });
  });

  it("resolves a date without a year to the next such day (year rollover)", async () => {
    const setup = await draftSetup();
    const date = {
      asWritten: "5 Jan",
      year: null,
      month: 1,
      day: 5,
      quote: "5 Jan",
      guessed: false,
    };
    mockModel({ answer: { ...EMPTY_DRAFT, date } });
    const now = new Date("2026-12-20T12:00:00Z");
    const input = { text: "Lunch on 5 Jan?" };
    const result = unwrap({ result: await draft({ context: setup.context, input, now }) });
    expect(result.date?.value).toBe("2027-01-05");
  });

  it("ignores a public mail domain and rejects an invented package", async () => {
    const setup = await draftSetup();
    const email = said({ value: "anna@gmail.com" });
    const packageName = said({ value: "Helicopter tour", quote: "wine" });
    mockModel({ answer: { ...EMPTY_DRAFT, email, packageName } });
    const text = "wine for us, anna@gmail.com";
    const result = unwrap({ result: await draft({ context: setup.context, input: { text } }) });
    expect(result.customerId).toBeNull();
    expect(result.package).toBeNull();
    expect(result.templateId).toBeNull();
  });

  it("is UNAVAILABLE for output that does not fit, a failing model or no model", async () => {
    const setup = await draftSetup();
    const input = { text: REQUEST };
    mockModel({ answer: { ...EMPTY_DRAFT, needs: "two vegans" } });
    expect(errorCode({ result: await draft({ context: setup.context, input }) })).toBe(
      "UNAVAILABLE",
    );
    setExtract({ extract: undefined });
    expect(errorCode({ result: await draft({ context: setup.context, input }) })).toBe(
      "UNAVAILABLE",
    );
  });

  it("needs order:write and resolves no customer without customer:read", async () => {
    const setup = await draftSetup();
    mockModel({ answer });
    const reader = { ...setup.context, permissions: { order: ["read"] as const } };
    expect(errorCode({ result: await draft({ context: reader, input: { text: REQUEST } }) })).toBe(
      "FORBIDDEN",
    );
    const noCustomers = { ...setup.context, permissions: { order: ["write"] as const } };
    const result = unwrap({
      result: await draft({ context: noCustomers, input: { text: REQUEST } }),
    });
    expect(result.customerId).toBeNull();
    expect(result.contactId).toBeNull();
  });
});
