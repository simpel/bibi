import { Form, StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type Dispatch, type ReactNode, useState } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { IntakeData } from "../load-intake-data";
import { CalendarSnapshot } from "./calendar-snapshot";
import { CreateBar } from "./create-bar";
import { CreateIssuesPanel } from "./create-issues-panel";
import { hasChoices, type IntakeAction, type IntakeState, isCustom } from "./intake-state";
import { LineDialogSlot, LinesSection } from "./lines-section";
import { MoreSection } from "./more-section";
import { OpenQuestionsPanel } from "./open-questions-panel";
import { BookingNoteField, OrderTitleField, OrderTypeFields } from "./review-form-fields";
import { ReviewHeader } from "./review-header";
import { StepBack } from "./step-back";
import { useCreateReadiness } from "./use-create-readiness";
import { useOpenQuestions } from "./use-open-questions";
import { useReviewActions } from "./use-review-actions";
import { useReviewForm } from "./use-review-form";
import { type ReviewModel, useReviewModel } from "./use-review-model";
import { useServerIssues } from "./use-server-issues";

type BodyProps = { model: ReviewModel; nonce: number; back: ReactNode; onConflict: () => void };

/** Step 4's form, its actions and what Create waits for. */
function useReviewBody({ model, onConflict }: Pick<BodyProps, "model" | "onConflict">) {
  const [conflict, setConflict] = useState(false);
  const server = useServerIssues({ review: model.review });
  const { form, submit, pending } = useReviewForm({
    model,
    onConflict: () => {
      setConflict(true);
      onConflict();
    },
    onUnmappedIssues: server.keep,
  });
  const actions = useReviewActions({ model, form });
  const questions = useOpenQuestions({ model });
  const ready = useCreateReadiness({
    ...{ form, model, questions: questions.length, serverIssues: server.issues },
  });
  return { form, submit, pending, conflict, actions, questions, ...ready };
}

/** Step 4's content: a form whose submit is Create. */
function ReviewBody({ model, nonce, back, onConflict }: BodyProps) {
  const body = useReviewBody({ model, onConflict });
  const { form, actions, questions, block } = body;
  // A custom booking's type and its fields were asked in the build step.
  const custom = model.pick.kind === "ONE_OFF";
  const { catalog } = model.data;
  return (
    <Form {...form}>
      <form
        onSubmit={(event) => (block ? event.preventDefault() : body.submit(event))}
        noValidate
        className="grid gap-5"
      >
        <ReviewHeader model={model} />
        <OrderTitleField form={form} />
        {custom ? null : (
          <OrderTypeFields form={form} catalog={catalog} type={model.orderType} custom={false} />
        )}
        <CalendarSnapshot model={model} nonce={nonce} />
        <LinesSection model={model} actions={actions} />
        <BookingNoteField form={form} />
        <OpenQuestionsPanel
          questions={questions}
          otherTypes={custom && catalog.orderTypes.length > 1}
          onAction={actions.act}
        />
        <MoreSection form={form} catalog={catalog} />
        <CreateIssuesPanel
          issues={body.issues}
          lines={model.review.lines}
          onEditLine={actions.open}
        />
        <CreateBar {...{ model, block, back }} pending={body.pending} conflict={body.conflict} />
      </form>
      <LineDialogSlot model={model} actions={actions} />
    </Form>
  );
}

export type ReviewStepProps = {
  data: IntakeData;
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
};

/** The last step: review the lines of a package or a custom booking, then Create (ADR 0081). */
export function ReviewStep({ data, state, dispatch }: ReviewStepProps) {
  const t = useTranslations("orderIntake.review");
  const timeZone = useOrganizationTimeZone();
  const [nonce, setNonce] = useState(0);
  const model = useReviewModel({ data, state, dispatch, timeZone, nonce });
  if (!model || state.open !== "review") return null;
  const number = 4 + Number(isCustom({ state })) + Number(hasChoices({ state }));
  return (
    <StepSection number={number} title={t("title")} state="open">
      <ReviewBody
        key={`${state.intakeKey}-${model.review.pickKey}`}
        {...{ model, nonce }}
        back={<StepBack step="review" state={state} dispatch={dispatch} />}
        onConflict={() => setNonce((value) => value + 1)}
      />
    </StepSection>
  );
}
