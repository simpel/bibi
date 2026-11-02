import { Button, Form, StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type Dispatch, type ReactNode, useState } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { IntakeData } from "../load-intake-data";
import { CalendarSnapshot } from "./calendar-snapshot";
import { CreateBar } from "./create-bar";
import { CreateIssuesPanel } from "./create-issues-panel";
import { DraftLineDialog } from "./draft-line-dialog";
import { DraftLinesTable } from "./draft-lines-table";
import { EmptyLines } from "./empty-lines";
import type { IntakeAction, IntakeState } from "./intake-state";
import { MoreSection } from "./more-section";
import { OpenQuestionsPanel } from "./open-questions-panel";
import { BookingNoteField, SavePackageFields, TicketTypeFields } from "./review-form-fields";
import { ReviewHeader } from "./review-header";
import { StepBack } from "./step-back";
import { useCreateReadiness } from "./use-create-readiness";
import { useOpenQuestions } from "./use-open-questions";
import { useReviewActions } from "./use-review-actions";
import { useReviewForm } from "./use-review-form";
import { type ReviewModel, useReviewModel } from "./use-review-model";
import { useServerIssues } from "./use-server-issues";

type LinesSectionProps = { model: ReviewModel; actions: ReturnType<typeof useReviewActions> };

/** The lines table, or the empty state with quick-add, and + Add line. */
function LinesSection({ model, actions }: LinesSectionProps) {
  const t = useTranslations("ticketIntake.review");
  return (
    <div className="grid gap-3">
      {model.review.lines.length > 0 ? (
        <DraftLinesTable model={model} onEdit={actions.open} onRemove={actions.remove} />
      ) : (
        <EmptyLines items={model.data.catalog.items} onQuickAdd={actions.quickAdd} />
      )}
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        onClick={() => actions.open({ line: null })}
      >
        {t("addLine")}
      </Button>
    </div>
  );
}

/** The line dialog while it is open (outside the form: its own form submits only itself). */
function LineDialogSlot({ model, actions }: LinesSectionProps) {
  if (!actions.dialog) return null;
  return (
    <DraftLineDialog
      {...{ model, line: actions.dialog.line, newKey: actions.dialog.newKey }}
      {...{ onSave: actions.save, onRemove: actions.remove, onClose: actions.close }}
    />
  );
}

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
  const oneOff = model.pick.kind === "ONE_OFF";
  const { catalog } = model.data;
  return (
    <Form {...form}>
      <form
        onSubmit={(event) => (block ? event.preventDefault() : body.submit(event))}
        noValidate
        className="grid gap-5"
      >
        <ReviewHeader model={model} />
        <TicketTypeFields form={form} catalog={catalog} type={model.ticketType} oneOff={oneOff} />
        <CalendarSnapshot model={model} nonce={nonce} />
        <LinesSection model={model} actions={actions} />
        <BookingNoteField form={form} />
        {oneOff ? <SavePackageFields form={form} /> : null}
        <OpenQuestionsPanel
          questions={questions}
          otherTypes={oneOff && catalog.ticketTypes.length > 1}
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

/** Step 4: review the package's lines, or build a one-off, then Create (ADR 0081). */
export function ReviewStep({ data, state, dispatch }: ReviewStepProps) {
  const t = useTranslations("ticketIntake.review");
  const timeZone = useOrganizationTimeZone();
  const [nonce, setNonce] = useState(0);
  const model = useReviewModel({ data, state, dispatch, timeZone, nonce });
  if (!model || state.open !== "review") return null;
  const title = model.pick.kind === "ONE_OFF" ? t("titleOneOff") : t("title");
  return (
    <StepSection number={4} title={title} state="open">
      <ReviewBody
        key={`${state.intakeKey}-${model.review.pickKey}`}
        {...{ model, nonce }}
        back={<StepBack step="review" dispatch={dispatch} />}
        onConflict={() => setNonce((value) => value + 1)}
      />
    </StepSection>
  );
}
