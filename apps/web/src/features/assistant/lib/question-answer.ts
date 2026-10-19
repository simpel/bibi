import type { AskedQuestion } from "@okazi/ai";

export type AnswerTextInput = {
  question: Pick<AskedQuestion, "choices">;
  /** Every value the questionnaire item submitted: a choice value and/or free text. */
  values: readonly string[];
};

/**
 * The answer as the user's next chat message: their own words when they wrote any, otherwise the
 * label of the picked choice (what they saw, in their language). Empty when nothing was given.
 */
export function answerText({ question, values }: AnswerTextInput): string {
  const labels = new Map(question.choices.map((choice) => [choice.value, choice.label]));
  const given = values.map((value) => value.trim()).filter((value) => value !== "");
  const ownWords = given.find((value) => !labels.has(value));
  if (ownWords) return ownWords;
  const picked = given.find((value) => labels.has(value));
  return picked ? (labels.get(picked) ?? "") : "";
}
