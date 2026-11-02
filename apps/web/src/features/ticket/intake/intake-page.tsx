"use client";

import type { IntakeData } from "../load-intake-data";
import { BuildSection } from "./build-step";
import { ChoicesSection } from "./choices-section";
import { DraftOffer } from "./draft-offer";
import type { IntakeMessage } from "./intake-message";
import type { IntakeStep } from "./intake-state";
import { MessageBanner } from "./message-banner";
import type { MessageDraft } from "./message-draft";
import { PackageSection } from "./package-section";
import { PasteDialog } from "./paste-dialog";
import { ReviewStep } from "./review-step";
import { useIntakeFlow } from "./use-intake-flow";
import { useIntakeSummaries } from "./use-intake-summaries";
import { usePasteDialog } from "./use-paste-dialog";
import { WhenSection } from "./when-section";
import { WhoSection } from "./who-section";

export type IntakePageProps = {
  data: IntakeData;
  message: IntakeMessage | null;
  /** Drafting from a message has a model (ADR 0084): `/new/ticket/message` opens the dialog. */
  draftEnabled: boolean;
  /** The step the URL names (`/new/ticket/<step>`); `who` for the bare path and `/message`. */
  step: IntakeStep;
};

/**
 * `/new/ticket`: the ticket intake on one page, from who asks to Create (ADR 0081). On
 * `/new/ticket/message` the paste dialog opens over step 1; what it reads prefills the steps
 * (ADR 0084). Opened from an inbox message, the ticket is attached to it (ADR 0085).
 */
export function IntakePage({ data, message, draftEnabled, step }: IntakePageProps) {
  const paste = usePasteDialog({ enabled: draftEnabled });
  const flow = useIntakeFlow({ data, message, urlStep: step, pasting: paste.open });
  const { state, dispatch, draft } = flow;
  const summaries = useIntakeSummaries({ state });
  const onRead = ({ draft: read }: { draft: MessageDraft }) => {
    draft.discardDraft();
    dispatch({ type: "applyDraft", draft: read });
    paste.close();
  };
  const steps = { data, state, dispatch, summaries };
  return (
    <div className="grid gap-3">
      <MessageBanner message={message} read={state.draft?.read ?? null} />
      {draft.offer ? (
        <DraftOffer
          draft={draft.offer}
          onContinue={draft.continueDraft}
          onDiscard={draft.discardDraft}
        />
      ) : null}
      <WhoSection {...steps} search={state.draft?.search ?? message?.search ?? null} />
      <WhenSection {...steps} />
      <PackageSection {...steps} />
      <BuildSection data={data} state={state} dispatch={dispatch} />
      <ChoicesSection data={data} state={state} dispatch={dispatch} />
      <ReviewStep data={data} state={state} dispatch={dispatch} />
      {paste.open ? <PasteDialog message={message} onRead={onRead} onClose={paste.close} /> : null}
    </div>
  );
}
