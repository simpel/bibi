import { describe, expect, it } from "vitest";
import { type CommentTemplate, commentMessage } from "./comment-message";

const template: CommentTemplate = ({ kind, name, instruction }) =>
  kind === "phase"
    ? `About the phase “${name}”: ${instruction}`
    : `About “${name}” in what we sell: ${instruction}`;

describe("commentMessage", () => {
  it("names the phase and keeps the instruction", () => {
    const text = commentMessage({
      target: { kind: "phase", name: "Quote sent" },
      instruction: "Rename it to Offer",
      template,
    });
    expect(text).toBe("About the phase “Quote sent”: Rename it to Offer");
  });

  it("uses the item type template for an item type", () => {
    const text = commentMessage({
      target: { kind: "itemType", name: "Lunch" },
      instruction: "Split into lunch and dinner",
      template,
    });
    expect(text).toBe("About “Lunch” in what we sell: Split into lunch and dinner");
  });

  it("trims the instruction", () => {
    const text = commentMessage({
      target: { kind: "phase", name: "Lost" },
      instruction: "  remove it \n",
      template,
    });
    expect(text).toBe("About the phase “Lost”: remove it");
  });

  it("is null for a blank instruction", () => {
    const target = { kind: "phase", name: "Lost" } as const;
    expect(commentMessage({ target, instruction: "   ", template })).toBeNull();
  });
});
