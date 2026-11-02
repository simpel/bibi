import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { applyAnswers } from "./apply-answers";
import type { FollowUpQuestion } from "./follow-up-questions";
import { periodOf } from "./intake-period";
import type { FollowUpAnswers, IntakeWhen } from "./intake-state";

export type QuestionOption = { answers: FollowUpAnswers; label: string };
export type QuestionText = { title: string; options: QuestionOption[] };

export type UseQuestionTextsInput = {
  when: IntakeWhen;
  questions: FollowUpQuestion[];
  timeZone: string;
};

type Translate = ReturnType<typeof useTranslations<"ticketIntake.questions">>;
type Context = UseQuestionTextsInput & { t: Translate; dates: DateTimeFormat };
type Of<K extends FollowUpQuestion["kind"]> = Extract<FollowUpQuestion, { kind: K }>;

function guestsText({ t, when, question }: Context & { question: Of<"GUESTS"> }): QuestionText {
  const { guests, raise } = question;
  const change = t(raise ? "guests.raise" : "guests.lower", { guests });
  return {
    title: t("guests.title", { headcount: when.guests }),
    options: [
      { answers: { guests: "CHANGE" }, label: change },
      { answers: { guests: "KEEP" }, label: t("guests.keep", { headcount: when.guests }) },
    ],
  };
}

function endText({ t, dates, when, timeZone, question }: Context & { question: Of<"END"> }) {
  const period = periodOf({ when, timeZone });
  const requestedEnd = period ? dates.time({ instant: period.endsAt }) : when.to;
  const end = dates.time({ instant: question.endsAt });
  return {
    title: t("end.title", { end, requestedEnd }),
    options: [
      { answers: { end: "EXTEND" }, label: t("end.extend", { end }) },
      { answers: { end: "KEEP" }, label: t("end.keep", { requestedEnd }) },
    ],
  } satisfies QuestionText;
}

type ClashInput = Context & { question: Of<"CLASH">; answers: FollowUpAnswers };

/** The move answer names the period the earlier answers and the shift give together. */
function clashText({ t, dates, when, questions, timeZone, question, answers }: ClashInput) {
  const moved = applyAnswers({ when, questions, answers: { ...answers, clash: "MOVE" }, timeZone });
  const period = question.firstFreeStart ? periodOf({ when: moved, timeZone }) : null;
  const options: QuestionOption[] = [{ answers: { clash: "PREBOOK" }, label: t("clash.prebook") }];
  if (period) {
    const range = dates.timeRange({ start: period.startsAt, end: period.endsAt });
    options.unshift({ answers: { clash: "MOVE" }, label: t("clash.move", { period: range }) });
  }
  return { title: t(period ? "clash.title" : "clash.titleNoFreeTime"), options };
}

export type QuestionTextInput = { question: FollowUpQuestion; answers: FollowUpAnswers };

/** Each follow-up question's text and its answers, with the times they would give. */
export function useQuestionTexts({ when, questions, timeZone }: UseQuestionTextsInput) {
  const t = useTranslations("ticketIntake.questions");
  const dates = useDateTimeFormat();
  const context: Context = { when, questions, timeZone, t, dates };
  return ({ question, answers }: QuestionTextInput): QuestionText => {
    if (question.kind === "GUESTS") return guestsText({ ...context, question });
    if (question.kind === "END") return endText({ ...context, question });
    return clashText({ ...context, question, answers });
  };
}
