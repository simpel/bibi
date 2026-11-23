import { describe, expect, it } from "vitest";
import { whenFormSchema } from "./when-form-schema";

const schema = whenFormSchema({ now: "2026-11-23T14:30" });
const values = { date: "2026-11-23", from: "15:00", to: "17:00", guests: "10" };

const failingPaths = ({ input }: { input: typeof values }) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

describe("whenFormSchema", () => {
  it("accepts a start later today or on a later day", () => {
    expect(failingPaths({ input: values })).toEqual([]);
    expect(failingPaths({ input: { ...values, date: "2026-11-24", from: "08:00" } })).toEqual([]);
  });

  it("refuses a past day on the date", () => {
    expect(failingPaths({ input: { ...values, date: "2026-11-22" } })).toEqual(["date"]);
  });

  it("refuses a start that has passed today on from", () => {
    expect(failingPaths({ input: { ...values, from: "14:00" } })).toEqual(["from"]);
  });

  it("accepts a start this very minute", () => {
    expect(failingPaths({ input: { ...values, from: "14:30" } })).toEqual([]);
  });
});
