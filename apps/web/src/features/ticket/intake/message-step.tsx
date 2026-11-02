import { Button, Form, StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Dispatch } from "react";
import { TextField } from "@/components/form/text-field";
import type { IntakeMessage } from "./intake-message";
import type { IntakeAction, IntakeState } from "./intake-state";
import { useMessageRead } from "./use-message-read";

export type MessageStepProps = {
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
  message: IntakeMessage | null;
};

/** The text area, Read the request and Fill in by hand instead (spec "0 · Start from a message"). */
function MessageForm({ dispatch, message }: Omit<MessageStepProps, "state">) {
  const t = useTranslations("ticketIntake.message");
  const { form, submit, pending, unavailable } = useMessageRead({
    message,
    onRead: (applied) => dispatch({ type: "applyDraft", ...applied }),
    onUnavailable: () => dispatch({ type: "skipMessage" }),
  });
  return (
    <Form {...form}>
      <form className="grid gap-4" onSubmit={submit} noValidate>
        <TextField form={form} name="text" label={t("text")} multiline rows={8} required />
        {unavailable ? <p className="text-sm text-muted-foreground">{t("unavailable")}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("reading") : t("read")}
          </Button>
          <Button type="button" variant="outline" onClick={() => dispatch({ type: "skipMessage" })}>
            {t("byHand")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * Step 0 (ADR 0084): shown when the intake opens from a message or the person chose "Start from
 * a message", and only when drafting has a model (the page decides on the server).
 */
export function MessageStep({ state, dispatch, message }: MessageStepProps) {
  const t = useTranslations("ticketIntake.message");
  const intake = useTranslations("ticketIntake");
  const open = state.open === "message";
  const summary = state.draft ? t("summaryRead") : t("summarySkipped");
  return (
    <StepSection
      number={0}
      title={t("title")}
      state={open ? "open" : "done"}
      summary={summary}
      changeLabel={intake("change")}
      onChangeStep={() => dispatch({ type: "openMessage" })}
    >
      <MessageForm dispatch={dispatch} message={message} />
    </StepSection>
  );
}
