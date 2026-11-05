import type { FollowUpQuestion } from "./follow-up-questions";
import { periodOf, whenOf } from "./intake-period";
import type { FollowUpAnswers, IntakeWhen } from "./intake-state";

export type ApplyAnswersInput = {
  when: IntakeWhen;
  questions: FollowUpQuestion[];
  answers: FollowUpAnswers;
  timeZone: string;
};

const find = <K extends FollowUpQuestion["kind"]>({
  questions,
  kind,
}: {
  questions: FollowUpQuestion[];
  kind: K;
}) =>
  questions.find((question) => question.kind === kind) as
    | Extract<FollowUpQuestion, { kind: K }>
    | undefined;

/**
 * The booking's period and headcount after the dialog: a changed guest count, the end moved to
 * where the package ends, then the whole period shifted to the first free start (from and to by
 * the same amount). Kept answers change nothing.
 */
export function applyAnswers({
  when,
  questions,
  answers,
  timeZone,
}: ApplyAnswersInput): IntakeWhen {
  const guestsQuestion = find({ questions, kind: "GUESTS" });
  const guests =
    answers.guests === "CHANGE" && guestsQuestion ? guestsQuestion.guests : when.guests;
  const period = periodOf({ when, timeZone });
  if (!period) return { ...when, guests };
  const endQuestion = find({ questions, kind: "END" });
  const endsAt = answers.end === "EXTEND" && endQuestion ? endQuestion.endsAt : period.endsAt;
  const firstFree = find({ questions, kind: "CLASH" })?.firstFreeStart ?? null;
  const shift =
    answers.clash === "MOVE" && firstFree ? firstFree.getTime() - period.startsAt.getTime() : 0;
  return whenOf({
    startsAt: new Date(period.startsAt.getTime() + shift),
    endsAt: new Date(endsAt.getTime() + shift),
    guests,
    timeZone,
  });
}
