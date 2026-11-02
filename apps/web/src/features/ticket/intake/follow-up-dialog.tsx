import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FollowUpQuestion } from "./follow-up-questions";
import type { FollowUpAnswers, IntakeWhen } from "./intake-state";
import { type QuestionOption, useQuestionTexts } from "./use-question-texts";

export type FollowUpRequest = { templateId: string; name: string; questions: FollowUpQuestion[] };

export type FollowUpDialogProps = {
  request: FollowUpRequest;
  when: IntakeWhen;
  timeZone: string;
  onCancel: () => void;
  onDone: (input: { answers: FollowUpAnswers }) => void;
};

type AnswerListProps = {
  options: QuestionOption[];
  onAnswer: (input: { chosen: FollowUpAnswers }) => void;
};

function AnswerList({ options, onAnswer }: AnswerListProps) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <Button
          key={option.label}
          type="button"
          variant="outline"
          className="h-auto justify-start whitespace-normal py-2 text-left"
          onClick={() => onAnswer({ chosen: option.answers })}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * The follow-up a picked package needs, one question at a time ("question 1 of 3"). Cancel
 * leaves nothing picked; the last answer hands every answer back.
 */
export function FollowUpDialog({ request, when, timeZone, onCancel, onDone }: FollowUpDialogProps) {
  const t = useTranslations("ticketIntake.questions");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<FollowUpAnswers>({});
  const texts = useQuestionTexts({ when, questions: request.questions, timeZone });
  const question = request.questions[index];
  if (!question) return null;
  const text = texts({ question, answers });
  const answer = ({ chosen }: { chosen: FollowUpAnswers }) => {
    const next = { ...answers, ...chosen };
    if (index + 1 < request.questions.length) {
      setAnswers(next);
      setIndex(index + 1);
    } else onDone({ answers: next });
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{request.name}</DialogTitle>
          <DialogDescription>
            {t("progress", { number: index + 1, total: request.questions.length })}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">{text.title}</p>
        <AnswerList options={text.options} onAnswer={answer} />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
