import { UI_COMPONENTS } from "@bibi/ai";
import { describe, expect, it } from "vitest";
import { GENERATIVE_COMPONENTS } from "./components";

describe("generative components", () => {
  it("has a React component for every key of the UI contract (and no extras)", () => {
    expect(Object.keys(GENERATIVE_COMPONENTS).sort()).toEqual([...UI_COMPONENTS].sort());
  });

  it("maps every key to a component function", () => {
    for (const key of UI_COMPONENTS) {
      expect(typeof GENERATIVE_COMPONENTS[key]).toBe("function");
    }
  });
});
