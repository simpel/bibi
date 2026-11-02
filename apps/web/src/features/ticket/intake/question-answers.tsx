import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { QuestionAnswer } from "./answer-question";
import type { InputStep } from "./intake-state";
import type { OpenQuestion } from "./open-questions";
import { useDelta } from "./use-open-question-text";

/** What an answer button does: change the review, or open a part of the page. */
export type AnswerAction =
  | { kind: "ANSWER"; answer: QuestionAnswer }
  | { kind: "ADD_LINE" }
  | { kind: "EDIT_LINE"; lineKey: string }
  | { kind: "FOCUS"; field: string }
  /** A guessed value to change: its step reopens, or the note when it has none (ADR 0084). */
  | { kind: "CHANGE_GUESS"; step: InputStep | null };

type Choice = { label: string; action: AnswerAction };

type Translate = ReturnType<typeof useTranslations<"ticketIntake.questions.answers">>;

type ChoicesInput = {
  question: OpenQuestion;
  otherTypes: boolean;
  t: Translate;
  delta: ReturnType<typeof useDelta>;
};

const answer = ({ label, value }: { label: string; value: QuestionAnswer }): Choice => ({
  label,
  action: { kind: "ANSWER", answer: value },
});

const editLine = ({ t, lineKey }: { t: Translate; lineKey: string }): Choice => ({
  label: t("editLine"),
  action: { kind: "EDIT_LINE", lineKey },
});

const focus = ({ label, field }: { label: string; field: string }): Choice => ({
  label,
  action: { kind: "FOCUS", field },
});

/** Questions about a line or the lines: change them, or open the line dialog. */
function lineChoices({ question, t, delta }: ChoicesInput): Choice[] {
  switch (question.kind) {
    case "START_CHANGED": {
      const moveLines = answer({
        label: t("moveLines", { delta: delta(question) }),
        value: "MOVE_LINES",
      });
      return [moveLines, answer({ label: t("keepTimes"), value: "KEEP_TIMES" })];
    }
    case "NO_LINES":
      return [
        answer({ label: t("lead"), value: "LEAD" }),
        { label: t("addLine"), action: { kind: "ADD_LINE" } },
      ];
    case "ZERO_QUANTITY":
      return [
        answer({ label: t("removeLine"), value: "REMOVE_LINE" }),
        editLine({ t, lineKey: question.lineKey }),
      ];
    case "OVER_QUANTITY":
      return [
        answer({ label: t("lowerToFit"), value: "LOWER_TO_FIT" }),
        editLine({ t, lineKey: question.lineKey }),
      ];
    case "POOL_SHORT": {
      const { needed, free } = question;
      const prebook = answer({
        label: t("prebookAll", { needed, more: needed - free }),
        value: "PREBOOK",
      });
      return [prebook, answer({ label: t("lowerToFree", { free }), value: "LOWER_TO_FREE" })];
    }
    default:
      return [];
  }
}

/** The answers each question offers (spec "Open questions"), in the spec's order. */
function choicesFor({ ...input }: ChoicesInput): Choice[] {
  const { question, otherTypes, t } = input;
  if (question.kind === "TYPE_FIELD") {
    const fill = focus({ label: t("fill"), field: `fields.${question.key}` });
    return otherTypes ? [fill, focus({ label: t("otherType"), field: "entityTypeId" })] : [fill];
  }
  if (question.kind === "PACKAGE_NAME") {
    const dontSave = answer({ label: t("dontSave"), value: "DONT_SAVE" });
    return [focus({ label: t("fill"), field: "packageName" }), dontSave];
  }
  if (question.kind === "GUESSED") {
    const keep = answer({ label: t("keepGuess", { value: question.value }), value: "KEEP_GUESS" });
    return [
      keep,
      { label: t("changeGuess"), action: { kind: "CHANGE_GUESS", step: question.step } },
    ];
  }
  return lineChoices(input);
}

export type QuestionAnswersProps = {
  question: OpenQuestion;
  /** The one-off may switch to another ticket type. */
  otherTypes: boolean;
  onAction: (input: { question: OpenQuestion; action: AnswerAction }) => void;
};

export function QuestionAnswers({ question, otherTypes, onAction }: QuestionAnswersProps) {
  const t = useTranslations("ticketIntake.questions.answers");
  const delta = useDelta();
  const choices = choicesFor({ question, otherTypes, t, delta });
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map(({ label, action }) => (
        <Button
          key={label}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAction({ question, action })}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
