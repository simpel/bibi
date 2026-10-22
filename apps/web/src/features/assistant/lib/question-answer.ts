import type { AskedQuestion } from "@bibi/ai";

export type AnswerTextInput = {
  /** `multiple` is missing on questions stored before checkboxes existed. */
  question: Pick<AskedQuestion, "choices"> & { multiple?: boolean };
  /** Every value the questionnaire item submitted: choice values and/or free text. */
  values: readonly string[];
};

/**
 * The answer as the user's next chat message, in the labels they saw (their language).
 * One answer: their own words when they wrote any, otherwise the picked label. Several answers:
 * every ticked label in the question's order, then their own words, comma-separated.
 * Empty when nothing was given.
 */
export function answerText({ question, values }: AnswerTextInput): string {
  const labels = new Map(question.choices.map((choice) => [choice.value, choice.label]));
  const given = values.map((value) => value.trim()).filter((value) => value !== "");
  const ownWords = given.find((value) => !labels.has(value));
  const picked = question.choices
    .filter((choice) => given.includes(choice.value))
    .map((choice) => choice.label);
  if (question.multiple) return [...picked, ...(ownWords ? [ownWords] : [])].join(", ");
  return ownWords ?? picked[0] ?? "";
}
