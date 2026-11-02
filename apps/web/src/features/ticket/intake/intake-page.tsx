"use client";

import { StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { IntakeData } from "../load-intake-data";
import type { IntakeMessage } from "./intake-message";
import { hasLines, type InputStep, type IntakeStep, stepView } from "./intake-state";
import { MessageBanner } from "./message-banner";
import { MessageSection } from "./message-section";
import { PackageStep } from "./package-step";
import { ReviewStep } from "./review-step";
import { useIntakeFlow } from "./use-intake-flow";
import { useIntakeSummaries } from "./use-intake-summaries";
import { WhenStep } from "./when-step";
import { type StepsProps, WhoSection } from "./who-section";

type SectionInput = StepsProps & {
  step: InputStep;
  t: ReturnType<typeof useTranslations<"ticketIntake">>;
};

const sectionProps = ({ state, dispatch, t, step }: SectionInput) => ({
  state: stepView({ state, step }),
  changeLabel: t("change"),
  onChangeStep: () => dispatch({ type: "change", step }),
});

function LaterSections(props: StepsProps) {
  const { data, state, dispatch, summaries } = props;
  const t = useTranslations("ticketIntake");
  const timeZone = useOrganizationTimeZone();
  const { who, when, pick } = state;
  return (
    <>
      <StepSection
        number={2}
        title={t("when.title")}
        summary={summaries.when}
        {...sectionProps({ ...props, t, step: "when" })}
      >
        <WhenStep
          {...{ key: state.draft ? "read" : "typed", when, prefill: state.draft?.when ?? null }}
          backToReview={hasLines({ state })}
          onDone={({ when: next }) => dispatch({ type: "setWhen", when: next })}
        />
      </StepSection>
      <StepSection
        number={3}
        title={t("package.title")}
        summary={summaries.pick}
        {...sectionProps({ ...props, t, step: "package" })}
      >
        {who && when ? (
          <PackageStep
            {...{ who, when, pick, packages: data.packages, timeZone, pickSummary: summaries.pick }}
            {...{ review: state.review, suggestedId: state.draft?.templateId ?? null }}
            onPick={(input) => dispatch({ type: "pick", ...input })}
            onUnpick={() => dispatch({ type: "unpick" })}
            onNext={(lines) => dispatch({ type: "completePackage", ...lines })}
          />
        ) : null}
      </StepSection>
      <ReviewStep data={data} state={state} dispatch={dispatch} />
    </>
  );
}

export type IntakePageProps = {
  data: IntakeData;
  message: IntakeMessage | null;
  /** Drafting from a message has a model (ADR 0084): step 0 is offered. */
  draftEnabled: boolean;
  /** The step the URL names (`/new/ticket/<step>`); `who` for the bare path. */
  step: IntakeStep;
};

/**
 * `/new/ticket`: the ticket intake on one page, from who asks to Create (ADR 0081); opened from
 * an inbox message it starts the customer search from the sender and attaches it (ADR 0085).
 */
export function IntakePage({ data, message, draftEnabled, step }: IntakePageProps) {
  const { state, dispatch, draft } = useIntakeFlow({ data, message, draftEnabled, urlStep: step });
  const summaries = useIntakeSummaries({ state });
  return (
    <div className="grid gap-3">
      {message ? <MessageBanner message={message} /> : null}
      <MessageSection {...{ state, dispatch, message }} enabled={draftEnabled} />
      <WhoSection
        {...{ data, state, dispatch, summaries, draft }}
        search={state.draft?.search ?? message?.search ?? null}
      />
      <LaterSections {...{ data, state, dispatch, summaries }} />
    </div>
  );
}
