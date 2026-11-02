import { StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Dispatch } from "react";
import type { IntakeData } from "../load-intake-data";
import { DraftOffer } from "./draft-offer";
import { type IntakeAction, type IntakeState, stepView } from "./intake-state";
import { useIntakeDraft } from "./use-intake-draft";
import type { IntakeSummaries } from "./use-intake-summaries";
import { WhoStep } from "./who-step";

export type StepsProps = {
  data: IntakeData;
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
  summaries: IntakeSummaries;
};

/** Step 1 with the offer to continue a local draft. */
export function WhoSection({
  data,
  state,
  dispatch,
  summaries,
  search,
}: StepsProps & { search: string | null }) {
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
        key={search ?? ""}
        {...{ who: state.who, recent: data.recent, search }}
        {...{ customerTypes: data.customerTypes, contactTypes: data.contactTypes }}
        onDone={({ who }) => dispatch({ type: "setWho", who })}
      />
    </StepSection>
  );
}
