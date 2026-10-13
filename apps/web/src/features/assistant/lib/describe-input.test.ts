import { describe, expect, it } from "vitest";
import { describeInput } from "./describe-input";

describe("describeInput", () => {
  it("lists object entries with readable values", () => {
    expect(
      describeInput({
        input: { name: "Aulan", capacity: 40, daylight: true, note: null, tags: ["a"] },
      }),
    ).toEqual([
      { key: "name", value: "Aulan" },
      { key: "capacity", value: "40" },
      { key: "daylight", value: "true" },
      { key: "note", value: "–" },
      { key: "tags", value: '["a"]' },
    ]);
  });

  it("handles non-object inputs", () => {
    expect(describeInput({ input: undefined })).toEqual([]);
    expect(describeInput({ input: "x" })).toEqual([{ key: "value", value: "x" }]);
  });
});
