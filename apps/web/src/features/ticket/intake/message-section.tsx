import { Button } from "@bibi/ui";
import { FileTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Dispatch } from "react";
import { DraftReadPanel } from "./draft-read-panel";
import type { IntakeMessage } from "./intake-message";
import type { IntakeAction, IntakeState } from "./intake-state";
import { MessageStep } from "./message-step";

export type MessageSectionProps = {
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
  message: IntakeMessage | null;
  /** The organization has a model for `ticket.intakeDraft` (checked on the server). */
  enabled: boolean;
};

/**
 * Step 0 and what it read (ADR 0084): the step when opened from a message or asked for, else a
 * "Start from a message" button; nothing when drafting has no model.
 */
export function MessageSection({ state, dispatch, message, enabled }: MessageSectionProps) {
  const t = useTranslations("ticketIntake.message");
  if (!enabled) return null;
  const shown = message !== null || state.open === "message" || Boolean(state.draft);
  if (!shown) {
    return (
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        onClick={() => dispatch({ type: "openMessage" })}
      >
        <FileTextIcon aria-hidden />
        {t("start")}
      </Button>
    );
  }
  return (
    <>
      <MessageStep state={state} dispatch={dispatch} message={message} />
      {state.draft ? <DraftReadPanel rows={state.draft.read} /> : null}
    </>
  );
}
