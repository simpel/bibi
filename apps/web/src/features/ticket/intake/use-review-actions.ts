import { useState } from "react";
import { answerQuestion } from "./answer-question";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import { removeLine, upsertLine } from "./draft-lines";
import type { OpenQuestion } from "./open-questions";
import type { AnswerAction } from "./question-answers";
import { quickLine } from "./quick-line";
import type { ReviewForm } from "./use-review-form";
import type { ReviewModel } from "./use-review-model";

/** The line dialog: closed, adding (`line` null) or editing a line. */
export type DialogState = { line: DraftLine | null; newKey: string } | null;

const newKey = () => crypto.randomUUID();

/** What step 4's buttons do to the draft: lines, quick-add, the dialog and question answers. */
export function useReviewActions({ model, form }: { model: ReviewModel; form: ReviewForm }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const { review, dispatch } = model;
  const setLines = ({ lines }: { lines: DraftLine[] }) =>
    dispatch({ type: "patchReview", patch: { lines } });
  const open = ({ line }: { line: DraftLine | null }) => setDialog({ line, newKey: newKey() });
  const save = ({ line }: { line: DraftLine }) => {
    setLines({ lines: upsertLine({ lines: review.lines, line }) });
    setDialog(null);
  };
  const remove = ({ key }: { key: string }) => {
    setLines({ lines: removeLine({ lines: review.lines, key }) });
    setDialog(null);
  };
  const quickAdd = ({ item }: { item: CatalogItem }) => {
    const lineTypeId = model.data.catalog.lineTypes[0]?.id;
    if (!lineTypeId) return;
    const line = quickLine({ item, lineTypeId, period: model.period, key: newKey() });
    setLines({ lines: [...review.lines, line] });
  };
  const act = ({ question, action }: { question: OpenQuestion; action: AnswerAction }) => {
    if (action.kind === "ADD_LINE") return open({ line: null });
    if (action.kind === "EDIT_LINE") {
      const line = review.lines.find(({ key }) => key === action.lineKey);
      return line ? open({ line }) : undefined;
    }
    if (action.kind === "FOCUS")
      return form.setFocus(action.field as Parameters<ReviewForm["setFocus"]>[0]);
    if (action.answer === "DONT_SAVE")
      return form.setValue("saveAsPackage", false, { shouldDirty: true });
    dispatch({
      type: "patchReview",
      patch: answerQuestion({ review, question, answer: action.answer }),
    });
  };
  return { dialog, open, close: () => setDialog(null), save, remove, quickAdd, act };
}
