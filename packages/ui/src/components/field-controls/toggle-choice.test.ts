import { describe, expect, it } from "vitest";
import { toggleChoice } from "./toggle-choice";

describe("toggleChoice", () => {
  it("adds and removes without a max", () => {
    expect(toggleChoice({ value: ["a"], choice: "b", checked: true })).toEqual(["a", "b"]);
    expect(toggleChoice({ value: ["a", "b"], choice: "a", checked: false })).toEqual(["b"]);
  });

  it("replaces the pick when the max is 1", () => {
    expect(toggleChoice({ value: ["a"], choice: "b", checked: true, max: 1 })).toEqual(["b"]);
  });

  it("keeps the value at the max when it is above 1", () => {
    const value = ["a", "b"];
    expect(toggleChoice({ value, choice: "c", checked: true, max: 2 })).toEqual(["a", "b"]);
  });
});
