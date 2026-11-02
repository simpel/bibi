import { useTranslations } from "next-intl";
import type { OpenQuestion } from "./open-questions";
import { type AnswerAction, QuestionAnswers } from "./question-answers";
import { useOpenQuestionText } from "./use-open-question-text";

export type OpenQuestionsPanelProps = {
  questions: OpenQuestion[];
  otherTypes: boolean;
  onAction: (input: { question: OpenQuestion; action: AnswerAction }) => void;
};

const keyOf = ({ question, index }: { question: OpenQuestion; index: number }) => {
  if (question.kind === "OPTIONS") return `${question.kind}-${question.lineKey}-${question.group}`;
  if (question.kind === "OVER_QUANTITY")
    return `${question.kind}-${question.lineKey}-${question.what}`;
  return "lineKey" in question
    ? `${question.kind}-${question.lineKey}`
    : `${question.kind}-${index}`;
};

/** The yellow panel of what blocks Create, each question with its answers. */
export function OpenQuestionsPanel({ questions, otherTypes, onAction }: OpenQuestionsPanelProps) {
  const t = useTranslations("ticketIntake.questions");
  const text = useOpenQuestionText();
  if (questions.length === 0) return null;
  return (
    <section
      aria-label={t("title")}
      className="grid gap-3 rounded-lg border border-warning bg-warning/10 p-4 text-sm"
    >
      <h3 className="font-medium">{t("title")}</h3>
      <ul className="grid gap-3">
        {questions.map((question, index) => (
          <li key={keyOf({ question, index })} className="grid gap-2">
            <p>{text({ question })}</p>
            <QuestionAnswers question={question} otherTypes={otherTypes} onAction={onAction} />
          </li>
        ))}
      </ul>
    </section>
  );
}
