import { type GuessedValue, openQuestions } from "./open-questions";
import type { ReviewModel } from "./use-review-model";

/** Nothing was guessed when no message was read. */
const NO_GUESSES: readonly GuessedValue[] = [];

/** The review's open questions (spec "Open questions"), lines checked against the catalog. */
export function useOpenQuestions({ model }: { model: ReviewModel }) {
  const { review, period, when, planned, ticketType } = model;
  const required = (ticketType?.fields ?? []).filter((field) => field.required);
  return openQuestions({
    ...{ review, start: period?.startsAt ?? null, headcount: when.guests, planned },
    ticketType: ticketType ? { name: ticketType.name, required } : null,
    guesses: model.state.draft?.guesses ?? NO_GUESSES,
    items: model.data.catalog.items,
  });
}
