import { describe, expect, it } from "vitest";
import { answerText } from "./question-answer";

const question = {
  choices: [
    { value: "rooms", label: "Rooms" },
    { value: "both", label: "Both" },
  ],
};

describe("answerText", () => {
  it("sends the picked choice's label", () => {
    expect(answerText({ question, values: ["both"] })).toBe("Both");
  });

  it("prefers the user's own words over a picked choice", () => {
    expect(answerText({ question, values: ["rooms", "  Rooms and a café  "] })).toBe(
      "Rooms and a café",
    );
  });

  it("is empty when nothing was given", () => {
    expect(answerText({ question, values: ["", "  "] })).toBe("");
  });

  it("sends every ticked label in the question's order for several answers", () => {
    const several = { ...question, multiple: true };
    expect(answerText({ question: several, values: ["both", "rooms"] })).toBe("Rooms, Both");
  });

  it("adds the user's own words after the ticked labels", () => {
    const several = { ...question, multiple: true };
    expect(answerText({ question: several, values: ["rooms", " a café "] })).toBe("Rooms, a café");
  });

  it("is empty for several answers when nothing was ticked", () => {
    expect(answerText({ question: { ...question, multiple: true }, values: [""] })).toBe("");
  });
});
