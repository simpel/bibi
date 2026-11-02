"use client";

import { StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type Dispatch, useReducer } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { IntakeData } from "../load-intake-data";
import { DraftOffer } from "./draft-offer";
import { reduceIntake } from "./intake-reducer";
import {
  INITIAL_INTAKE,
  type InputStep,
  type IntakeAction,
  type IntakeState,
  stepView,
} from "./intake-state";
import { PackageStep } from "./package-step";
import { ReviewPlaceholder } from "./review-placeholder";
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
          backToReview={pick !== null}
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
            onPick={(input) => dispatch({ type: "pick", ...input })}
            onUnpick={() => dispatch({ type: "unpick" })}
            onNext={() => dispatch({ type: "completePackage" })}
          />
        ) : null}
      </StepSection>
      {state.open === "review" ? <ReviewPlaceholder summaries={summaries} /> : null}
    </>
  );
}

export type IntakePageProps = { data: IntakeData };

/** `/new/ticket/intake`: steps 1–3 of the ticket intake on one page (ADR 0081, plan slice 6). */
export function IntakePage({ data }: IntakePageProps) {
  const [state, dispatch] = useReducer(
    (current: IntakeState, action: IntakeAction) => reduceIntake({ state: current, action }),
    INITIAL_INTAKE,
  );
  const summaries = useIntakeSummaries({ state });
  return (
    <div className="grid gap-3">
      <WhoSection {...{ data, state, dispatch, summaries }} />
      <LaterSections {...{ data, state, dispatch, summaries }} />
    </div>
  );
}
