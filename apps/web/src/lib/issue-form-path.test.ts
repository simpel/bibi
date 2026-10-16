import { describe, expect, it } from "vitest";
import { isFormPath } from "./issue-form-path";

describe("isFormPath", () => {
  const values = { name: "", fields: { capacity: "" } };

  it("accepts a top-level key", () => {
    expect(isFormPath({ path: "name", values })).toBe(true);
  });

  it("accepts a nested fields.<key> path", () => {
    expect(isFormPath({ path: "fields.capacity", values })).toBe(true);
  });

  it("rejects an unknown path", () => {
    expect(isFormPath({ path: "other.capacity", values })).toBe(false);
    expect(isFormPath({ path: "", values })).toBe(false);
  });
});
