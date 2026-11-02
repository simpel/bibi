import { describe, expect, it } from "vitest";
import { typeHues } from "./type-hue";

describe("typeHues", () => {
  it("gives each type a hue by its name's order, whatever the input order", () => {
    const hues = typeHues({ typeNames: ["Meal", "Drink", "Meal", "Conference room"] });
    expect([...hues]).toEqual([
      ["Conference room", 1],
      ["Drink", 2],
      ["Meal", 3],
    ]);
  });

  it("starts over after five types", () => {
    const hues = typeHues({ typeNames: ["a", "b", "c", "d", "e", "f"] });
    expect(hues.get("f")).toBe(1);
  });
});
