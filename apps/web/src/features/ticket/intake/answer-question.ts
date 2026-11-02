import type { DraftLine } from "./draft-line";
import { removeLine, shiftLines } from "./draft-lines";
import type { OpenQuestion } from "./open-questions";
import type { IntakeReview } from "./review-state";

/** An answer that changes the review itself; Edit, Add a line and fill-in answers open the UI. */
export type QuestionAnswer =
  | "MOVE_LINES"
  | "KEEP_TIMES"
  | "LEAD"
  | "REMOVE_LINE"
  | "LOWER_TO_FIT"
  | "PREBOOK"
  | "LOWER_TO_FREE"
  | "DONT_SAVE";

/** Counts lowered from the last one until they add up to at most `limit`. */
export function lowerToFit({ counts, limit }: { counts: number[]; limit: number }): number[] {
  let excess = counts.reduce((total, count) => total + count, 0) - limit;
  const lowered = [...counts];
  for (let index = lowered.length - 1; index >= 0 && excess > 0; index -= 1) {
    const cut = Math.min(lowered[index] ?? 0, excess);
    lowered[index] = (lowered[index] ?? 0) - cut;
    excess -= cut;
  }
  return lowered;
}

type LineChange = {
  review: IntakeReview;
  key: string;
  change: (input: { line: DraftLine }) => DraftLine;
};

const changeLine = ({ review, key, change }: LineChange): Partial<IntakeReview> => ({
  lines: review.lines.map((line) => (line.key === key ? change({ line }) : line)),
});

type FitInput = { line: DraftLine; question: Extract<OpenQuestion, { kind: "OVER_QUANTITY" }> };

/** Choices or needs lowered to the line's quantity; a count lowered to 0 is dropped. */
function fitted({ line, question }: FitInput): DraftLine {
  const limit = question.quantity;
  if (question.what === "NEEDS") {
    const counts = lowerToFit({ counts: line.needs.map((need) => need.quantity), limit });
    const needs = line.needs.map((need, index) => ({ ...need, quantity: counts[index] ?? 0 }));
    return { ...line, needs: needs.filter((need) => need.quantity > 0) };
  }
  const counts = lowerToFit({ counts: line.options.map((option) => option.quantity ?? 0), limit });
  const options = line.options.map((option, index) =>
    option.quantity === null ? option : { ...option, quantity: counts[index] ?? 0 },
  );
  return { ...line, options: options.filter((option) => option.quantity !== 0) };
}

export type AnswerQuestionInput = {
  review: IntakeReview;
  question: OpenQuestion;
  answer: QuestionAnswer;
};

type Patch = Partial<IntakeReview>;

/** Answers that change one line: lower its choices or needs, or its quantity to what is free. */
function lineAnswer({ review, question, answer }: AnswerQuestionInput): Patch {
  if (question.kind === "OVER_QUANTITY" && answer === "LOWER_TO_FIT") {
    const change = ({ line }: { line: DraftLine }) => fitted({ line, question });
    return changeLine({ review, key: question.lineKey, change });
  }
  if (question.kind === "POOL_SHORT" && answer === "LOWER_TO_FREE") {
    const change = ({ line }: { line: DraftLine }) => ({ ...line, quantity: question.free });
    return changeLine({ review, key: question.lineKey, change });
  }
  if (question.kind === "ZERO_QUANTITY" && answer === "REMOVE_LINE") {
    return { lines: removeLine({ lines: review.lines, key: question.lineKey }) };
  }
  return {};
}

/** The review patch an answer makes (spec "Open questions"); an answer that does not fit, none. */
export function answerQuestion({ review, question, answer }: AnswerQuestionInput): Patch {
  const accepted = ({ key }: { key: string }) => ({ accepted: [...review.accepted, key] });
  if (question.kind === "START_CHANGED") {
    const plannedStart = question.to.toISOString();
    if (answer === "KEEP_TIMES") return { plannedStart };
    if (answer !== "MOVE_LINES") return {};
    return { plannedStart, lines: shiftLines({ lines: review.lines, deltaMs: question.deltaMs }) };
  }
  if (question.kind === "NO_LINES" && answer === "LEAD") return accepted({ key: "LEAD" });
  if (question.kind === "POOL_SHORT" && answer === "PREBOOK") {
    return accepted({ key: `POOL:${question.lineKey}` });
  }
  if (question.kind === "PACKAGE_NAME" && answer === "DONT_SAVE") return { saveAsPackage: false };
  return lineAnswer({ review, question, answer });
}
