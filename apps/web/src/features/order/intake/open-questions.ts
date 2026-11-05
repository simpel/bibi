import type { PreviewLine } from "@bibi/core";
import { type DraftLine, isTimed, quantityOf } from "./draft-line";
import type { InputStep } from "./intake-state";
import {
  type ItemGroups,
  type OpenChoiceQuestion,
  type OptionsQuestion,
  openChoiceQuestions,
  optionQuestions,
} from "./option-questions";
import type { IntakeReview } from "./review-state";
/**
 * A value the assistant guessed from a message (ADR 0084): an open question until kept
 * (`GUESS:<key>` in `accepted`) or changed. `step` is where Change goes; null opens the note.
 */
export type GuessedValue = {
  key: string;
  /** A `DraftField`, named through `orderIntake.draft.fields`. */
  field: string;
  value: string;
  step: InputStep | null;
};

/** An order type's own field the review must have before Create. */
export type RequiredField = { key: string; name: string };

type OverQuantity = { what: "CHOICES" | "NEEDS"; count: number; quantity: number };

/** One question that blocks Create (ADR 0081 decision 8), in the spec's order. */
export type OpenQuestion =
  | { kind: "START_CHANGED"; from: Date; to: Date; deltaMs: number }
  | { kind: "NO_LINES" }
  | { kind: "ZERO_QUANTITY"; lineKey: string; name: string }
  | ({ kind: "OVER_QUANTITY"; lineKey: string; name: string } & OverQuantity)
  | { kind: "POOL_SHORT"; lineKey: string; name: string; needed: number; free: number }
  | OptionsQuestion
  | OpenChoiceQuestion // ADR 0089
  | ({ kind: "GUESSED" } & GuessedValue)
  | { kind: "TYPE_FIELD"; key: string; fieldName: string; typeName: string }
  | { kind: "PACKAGE_NAME" };

export type OpenQuestionsInput = {
  review: IntakeReview;
  /** The order's start as step 2 now says; null when it is not a period. */
  start: Date | null;
  headcount: number;
  /** The draft's preview lines in the same order; null while none is ready. */
  planned: readonly PreviewLine[] | null;
  orderType: { name: string; required: RequiredField[] } | null;
  guesses?: readonly GuessedValue[];
  /** The catalog's items with their groups: a line's choices are checked against its item's. */
  items?: readonly ItemGroups[];
};

function startQuestion({ review, start }: OpenQuestionsInput): OpenQuestion[] {
  if (!start || !review.plannedStart) return [];
  if (!review.lines.some((line) => isTimed({ line }))) return [];
  const from = new Date(review.plannedStart);
  const deltaMs = start.getTime() - from.getTime();
  return deltaMs === 0 ? [] : [{ kind: "START_CHANGED", from, to: start, deltaMs }];
}

const sum = ({ counts }: { counts: number[] }) => counts.reduce((total, count) => total + count, 0);

type LineInput = { line: DraftLine; planned: PreviewLine | undefined; headcount: number };
type LineQuestionsInput = LineInput & { accepted: string[]; items: readonly ItemGroups[] };

function overQuantity({ line, planned, headcount }: LineInput): OpenQuestion[] {
  const quantity = planned?.effectiveQuantity ?? quantityOf({ line, headcount });
  const { key: lineKey, name } = line;
  const choices = sum({ counts: line.options.map((option) => option.quantity ?? 0) });
  const needs = sum({ counts: line.needs.map((need) => need.quantity) });
  const questions: OpenQuestion[] = [];
  if (choices > quantity) {
    questions.push({
      kind: "OVER_QUANTITY",
      lineKey,
      name,
      what: "CHOICES",
      count: choices,
      quantity,
    });
  }
  if (needs > quantity) {
    questions.push({ kind: "OVER_QUANTITY", lineKey, name, what: "NEEDS", count: needs, quantity });
  }
  return questions;
}

function lineQuestions({ line, planned, headcount, accepted, items }: LineQuestionsInput) {
  if (line.quantity === 0) {
    return [{ kind: "ZERO_QUANTITY", lineKey: line.key, name: line.name } as const];
  }
  const questions: OpenQuestion[] = [
    ...optionQuestions({ line, items }),
    ...openChoiceQuestions({ line, items, accepted }),
    ...overQuantity({ line, planned, headcount }),
  ];
  const short = planned?.issues.find((issue) => issue.kind === "POOL_SHORT");
  if (short && !accepted.includes(`POOL:${line.key}`)) {
    const { needed, free } = { needed: short.needed ?? 0, free: short.free ?? 0 };
    questions.push({ kind: "POOL_SHORT", lineKey: line.key, name: line.name, needed, free });
  }
  return questions;
}

const isFilled = ({ value }: { value: unknown }) =>
  value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length);

function reviewQuestions({ review, orderType }: OpenQuestionsInput): OpenQuestion[] {
  const questions: OpenQuestion[] = (orderType?.required ?? [])
    .filter(({ key }) => !isFilled({ value: review.orderFields[key] }))
    .map(({ key, name }) => ({
      kind: "TYPE_FIELD",
      key,
      fieldName: name,
      typeName: orderType?.name ?? "",
    }));
  if (review.saveAsPackage && review.packageName.trim() === "") {
    questions.push({ kind: "PACKAGE_NAME" });
  }
  return questions;
}

/**
 * What must be answered before Create (spec "Open questions"): the start moved after lines
 * exist, no lines at all (unless a lead was accepted), a line with quantity 0, choices breaking a
 * group's pick rule, a required choice not made (unless left for later, ADR 0089), choices or
 * needs above the quantity, a pool short that day (unless prebooking it was accepted), a guessed
 * value, an order type's required field and a package name to save. Clashes are not questions.
 */
export function openQuestions({ ...input }: OpenQuestionsInput): OpenQuestion[] {
  const { review, planned, headcount, guesses = [], items = [] } = input;
  const noLines: OpenQuestion[] =
    review.lines.length === 0 && !review.accepted.includes("LEAD") ? [{ kind: "NO_LINES" }] : [];
  const lines = review.lines.flatMap((line, index) =>
    lineQuestions({
      ...{ line, planned: planned?.[index], headcount, accepted: review.accepted, items },
    }),
  );
  const guessed = guesses
    .filter(({ key }) => !review.accepted.includes(`GUESS:${key}`))
    .map((guess) => ({ kind: "GUESSED", ...guess }) as const);
  return [...startQuestion(input), ...noLines, ...lines, ...guessed, ...reviewQuestions(input)];
}
