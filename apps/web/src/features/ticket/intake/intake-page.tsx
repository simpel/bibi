"use client";

import { StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type Dispatch, useReducer } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { IntakeData } from "../load-intake-data";
import { DraftOffer } from "./draft-offer";
import { reduceIntake } from "./intake-reducer";
import {
  hasLines,
  type InputStep,
  type IntakeAction,
  type IntakeState,
  initialIntake,
  stepView,
} from "./intake-state";
import { PackageStep } from "./package-step";
import { ReviewStep } from "./review-step";
import { useIntakeDraft } from "./use-intake-draft";
import { type IntakeSummaries, useIntakeSummaries } from "./use-intake-summaries";
import { WhenStep } from "./when-step";
import { WhoStep } from "./who-step";

type StepsProps = {
  data: IntakeData;
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
  summaries: IntakeSummaries;
};

function WhoSection({ data, state, dispatch, summaries }: StepsProps) {
  const t = useTranslations("ticketIntake");
  const draft = useIntakeDraft({
    key: data.draftKey,
    state,
    onRestore: ({ state: restored }) => dispatch({ type: "restore", state: restored }),
  });
  const change = () => dispatch({ type: "change", step: "who" });
  return (
    <StepSection
      {...{ number: 1, title: t("who.title"), summary: summaries.who, changeLabel: t("change") }}
      state={stepView({ state, step: "who" })}
      onChangeStep={change}
    >
      {draft.offer ? (
        <DraftOffer
          draft={draft.offer}
          onContinue={draft.continueDraft}
          onDiscard={draft.discardDraft}
        />
      ) : null}
      <WhoStep
        {...{ who: state.who, recent: data.recent }}
        {...{ customerTypes: data.customerTypes, contactTypes: data.contactTypes }}
        onDone={({ who }) => dispatch({ type: "setWho", who })}
      />
    </StepSection>
  );
}

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
          when={when}
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
            review={state.review}
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

export type IntakePageProps = { data: IntakeData };

/** `/new/ticket`: the ticket intake on one page, from who asks to Create (ADR 0081). */
export function IntakePage({ data }: IntakePageProps) {
  const [state, dispatch] = useReducer(
    (current: IntakeState, action: IntakeAction) => reduceIntake({ state: current, action }),
    undefined,
    () => initialIntake({ intakeKey: crypto.randomUUID() }),
  );
  const summaries = useIntakeSummaries({ state });
  return (
    <div className="grid gap-3">
      <WhoSection {...{ data, state, dispatch, summaries }} />
      <LaterSections {...{ data, state, dispatch, summaries }} />
    </div>
  );
}
