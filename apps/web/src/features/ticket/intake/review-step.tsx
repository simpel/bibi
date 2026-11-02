import { Button, Form, StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type Dispatch, useState } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { IntakeData } from "../load-intake-data";
import { CalendarSnapshot } from "./calendar-snapshot";
import { CreateBar } from "./create-bar";
import { DraftLineDialog } from "./draft-line-dialog";
import { DraftLinesTable } from "./draft-lines-table";
import { EmptyLines } from "./empty-lines";
import type { IntakeAction, IntakeState } from "./intake-state";
import { MoreSection } from "./more-section";
import { type GuessedValue, openQuestions } from "./open-questions";
import { OpenQuestionsPanel } from "./open-questions-panel";
import { BookingNoteField, SavePackageFields, TicketTypeFields } from "./review-form-fields";
import { ReviewHeader } from "./review-header";
import { useReviewActions } from "./use-review-actions";
import { useReviewForm } from "./use-review-form";
import { type ReviewModel, useReviewModel } from "./use-review-model";

/** Nothing was guessed when no message was read. */
const NO_GUESSES: readonly GuessedValue[] = [];

function useQuestions({ model }: { model: ReviewModel }) {
  const { review, period, when, planned, ticketType } = model;
  const required = (ticketType?.fields ?? []).filter((field) => field.required);
  return openQuestions({
    ...{ review, start: period?.startsAt ?? null, headcount: when.guests, planned },
    ticketType: ticketType ? { name: ticketType.name, required } : null,
    guesses: model.state.draft?.guesses ?? NO_GUESSES,
  });
}

type LinesSectionProps = { model: ReviewModel; actions: ReturnType<typeof useReviewActions> };

/** The lines table, or the empty state with quick-add, and + Add line. */
function LinesSection({ model, actions }: LinesSectionProps) {
  const t = useTranslations("ticketIntake.review");
  return (
    <div className="grid gap-3">
      {model.review.lines.length > 0 ? (
        <DraftLinesTable model={model} onEdit={actions.open} />
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

type BodyProps = { model: ReviewModel; nonce: number; onConflict: () => void };

/** Step 4's content: a form whose submit is Create. */
function ReviewBody({ model, nonce, onConflict }: BodyProps) {
  const [conflict, setConflict] = useState(false);
  const { form, submit, pending } = useReviewForm({
    model,
    onConflict: () => {
      setConflict(true);
      onConflict();
    },
  });
  const actions = useReviewActions({ model, form });
  const questions = useQuestions({ model });
  const oneOff = model.pick.kind === "ONE_OFF";
  const { catalog } = model.data;
  return (
    <Form {...form}>
      <form
        onSubmit={(event) => (questions.length > 0 ? event.preventDefault() : submit(event))}
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
        <CreateBar {...{ model, pending, conflict }} questions={questions.length} />
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
        onConflict={() => setNonce((value) => value + 1)}
      />
    </StepSection>
  );
}
