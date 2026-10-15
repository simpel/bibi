import { describe, expect, it } from "vitest";
import { parseRecurrenceRule } from "../src/recurrence/parse-recurrence-rule";
import { RecurrenceRuleSchema, serializeRecurrenceRule } from "../src/schemas";
import { unwrap } from "./helpers";

type IssuesInput = { rrule: string };

function issuesOf({ rrule }: IssuesInput): { code: string; paths: string[] } {
  const result = parseRecurrenceRule({ rrule });
  if (result.ok) throw new Error(`Expected ${rrule} to be invalid`);
  return { code: result.error.code, paths: result.error.issues.map((issue) => issue.path) };
}

describe("recurrence rule (ADR 0023)", () => {
  it("parses the demo seed rules into structured form", () => {
    expect(
      unwrap({ result: parseRecurrenceRule({ rrule: "FREQ=MONTHLY;BYDAY=1TU;COUNT=10" }) }),
    ).toEqual({ freq: "MONTHLY", interval: 1, byDay: ["1TU"], count: 10 });
    expect(
      unwrap({ result: parseRecurrenceRule({ rrule: "FREQ=WEEKLY;BYDAY=TH;COUNT=6" }) }),
    ).toEqual({ freq: "WEEKLY", interval: 1, byDay: ["TH"], count: 6 });
  });

  it("accepts an RRULE: prefix, lower case, INTERVAL, BYMONTHDAY and UNTIL", () => {
    const rrule = "rrule:freq=monthly;interval=2;bymonthday=1,15;until=20271231";
    expect(unwrap({ result: parseRecurrenceRule({ rrule }) })).toEqual({
      freq: "MONTHLY",
      interval: 2,
      byMonthDay: [1, 15],
      until: "2027-12-31",
    });
  });

  it("round-trips through serialization", () => {
    for (const rrule of [
      "FREQ=MONTHLY;BYDAY=1TU;COUNT=10",
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH;UNTIL=20270630",
      "FREQ=MONTHLY;BYDAY=-1FR",
      "FREQ=MONTHLY;BYMONTHDAY=31;COUNT=4",
    ]) {
      const rule = unwrap({ result: parseRecurrenceRule({ rrule }) });
      expect(serializeRecurrenceRule({ rule })).toBe(rrule);
    }
  });

  it("rejects COUNT together with UNTIL on the until field", () => {
    expect(issuesOf({ rrule: "FREQ=WEEKLY;COUNT=3;UNTIL=20270101" })).toEqual({
      code: "VALIDATION",
      paths: ["until"],
    });
  });

  it("reports one issue per invalid field", () => {
    const { code, paths } = issuesOf({
      rrule: "FREQ=DAILY;INTERVAL=0;BYDAY=TU,XX;COUNT=abc;UNTIL=2027-01-01",
    });
    expect(code).toBe("VALIDATION");
    expect(paths).toEqual(
      expect.arrayContaining(["freq", "interval", "byDay.1", "count", "until"]),
    );
  });

  it("rejects parts outside the subset and malformed parts", () => {
    expect(issuesOf({ rrule: "FREQ=WEEKLY;BYHOUR=9" }).paths).toEqual([""]);
    expect(issuesOf({ rrule: "FREQ=WEEKLY;COUNT=2;COUNT=3" }).paths).toEqual(["count"]);
    expect(issuesOf({ rrule: "FREQ=WEEKLY;BYDAY" }).paths).toEqual(["byDay"]);
    expect(issuesOf({ rrule: "" }).paths).toEqual(["freq"]);
  });

  it("rejects combinations RFC 5545 or the subset do not allow", () => {
    expect(issuesOf({ rrule: "FREQ=WEEKLY;BYDAY=1TU" }).paths).toEqual(["byDay.0"]);
    expect(issuesOf({ rrule: "FREQ=WEEKLY;BYMONTHDAY=1" }).paths).toEqual(["byMonthDay"]);
    expect(issuesOf({ rrule: "FREQ=MONTHLY;BYDAY=TU;BYMONTHDAY=1" }).paths).toEqual(["byMonthDay"]);
    expect(issuesOf({ rrule: "FREQ=WEEKLY;BYDAY=TU,TU" }).paths).toEqual(["byDay"]);
    expect(issuesOf({ rrule: "FREQ=MONTHLY;BYMONTHDAY=32" }).paths).toEqual(["byMonthDay.0"]);
  });

  it("validates the structured form with the same rules", () => {
    const parsed = RecurrenceRuleSchema.safeParse({ freq: "MONTHLY", byDay: ["6TU"] });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((issue) => issue.path.join("."))).toEqual(["byDay.0"]);
  });
});
