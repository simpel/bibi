import { describe, expect, it } from "vitest";
import { iconOptions, MAX_ICON_OPTIONS } from "./icon-options";

describe("iconOptions", () => {
  it("suggests icons from the item's name before the common ones", () => {
    const options = iconOptions({ query: "", name: "Wine tasting" });
    expect(options[0]).toBe("wine");
    expect(options).toContain("coffee");
  });

  it("searches every icon name and caps the list", () => {
    const options = iconOptions({ query: "arrow", name: "" });
    expect(options.every((icon) => icon.includes("arrow"))).toBe(true);
    expect(options).toHaveLength(MAX_ICON_OPTIONS);
  });

  it("offers nothing for a search with no match", () => {
    expect(iconOptions({ query: "zzzz", name: "" })).toEqual([]);
  });
});
