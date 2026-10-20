"use client";

import {
  Card,
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { GenerativeProps } from "./generative-props";
import { useQuestionAnswer } from "./use-question-answer";

export type QuestionnaireViewProps = GenerativeProps<"questionnaire">;

const NAME = "answer";

type QuestionChoicesProps = Pick<QuestionnaireViewProps, "question"> & { open: boolean };

/** The clickable answers and, when allowed, a free-text answer. */
function QuestionChoices({ question, open }: QuestionChoicesProps) {
  const t = useTranslations("assistant.questionnaire");
  return (
    <QuestionnaireChoices>
      {question.choices.map((choice) => (
        <QuestionnaireChoice key={choice.value} value={choice.value} disabled={!open}>
          <span className="font-medium">{choice.label}</span>
          {choice.description ? (
            <QuestionnaireChoiceDescription>{choice.description}</QuestionnaireChoiceDescription>
          ) : null}
        </QuestionnaireChoice>
      ))}
      {question.allowOther ? (
        <QuestionnaireInput
          aria-label={t("otherLabel")}
          placeholder={t("otherPlaceholder")}
          disabled={!open}
        />
      ) : null}
    </QuestionnaireChoices>
  );
}

/** A question from the assistant (`ask_question`); the answer is sent as the next chat message. */
export function QuestionnaireView({ question, toolCallId }: QuestionnaireViewProps) {
  const t = useTranslations("assistant.questionnaire");
  const { open, answer } = useQuestionAnswer({ question, toolCallId });
  const items = [{ name: NAME, required: true, choices: question.choices }];
  return (
    <Card data-slot="questionnaire-card" data-open={open} className="p-4 shadow-none">
      <Questionnaire
        defaultItem={NAME}
        items={items}
        shortcuts="numbers"
        onSubmit={(event) => {
          // The answer goes to the chat as the next message; the form itself is never sent.
          event.preventDefault();
          answer({ values: new FormData(event.currentTarget).getAll(NAME).map(String) });
        }}
      >
        {/* Never disable the item: the primitive hides a disabled item, which left answered
            questions as an empty card. The choices and input are disabled instead. */}
        <QuestionnaireItem name={NAME} required multiple={question.multiple}>
          <QuestionnaireTitle>{question.question}</QuestionnaireTitle>
          {question.description ? (
            <QuestionnaireDescription>{question.description}</QuestionnaireDescription>
          ) : null}
          <QuestionChoices question={question} open={open} />
        </QuestionnaireItem>
        {open ? (
          <QuestionnaireActions>
            <QuestionnaireSubmit>{t("answer")}</QuestionnaireSubmit>
          </QuestionnaireActions>
        ) : null}
      </Questionnaire>
    </Card>
  );
}
