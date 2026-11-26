import { describe, expect, it } from "vitest";
import { type DraftElement, NO_OVERRIDES, newKey, toInput } from "./draft";

const piece = ({ key }: { key: string }): DraftElement => ({
  ...NO_OVERRIDES,
  ...{ key, kindId: "kind_round", xCm: 100, yCm: 200, rotationDeg: 0, label: "4" },
});

describe("a draft as the save input (ADR 0119)", () => {
  it("sends a saved piece's id so it keeps it", () => {
    expect(toInput({ element: piece({ key: "el_saved" }) })).toMatchObject({
      id: "el_saved",
      kindId: "kind_round",
      label: "4",
    });
  });

  it("sends no id for a piece created in the editor", () => {
    const input = toInput({ element: piece({ key: newKey() }) });
    expect(input).not.toHaveProperty("id");
    expect(input).not.toHaveProperty("key");
  });
});
