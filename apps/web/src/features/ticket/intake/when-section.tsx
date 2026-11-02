import { Button, StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type StepsProps, sectionProps } from "./section-props";
import { StepBack } from "./step-back";
import { WHEN_FORM_ID, WhenStep } from "./when-step";

/** Step 2 with Back (bottom left) and Next (bottom right; submits, back to review once lines exist). */
export function WhenSection({ state, dispatch, summaries }: Omit<StepsProps, "data">) {
  const t = useTranslations("ticketIntake");
  const { when } = state;
  return (
    <StepSection
      number={2}
      title={t("when.title")}
      summary={summaries.when}
      {...sectionProps({ state, dispatch, step: "when", changeLabel: t("change") })}
      footerStart={<StepBack step="when" dispatch={dispatch} />}
      footerEnd={
        <Button type="submit" form={WHEN_FORM_ID}>
          {t("next")}
        </Button>
      }
    >
      <WhenStep
        {...{ key: state.draft ? "read" : "typed", when, prefill: state.draft?.when ?? null }}
        onDone={({ when: next }) => dispatch({ type: "setWhen", when: next })}
      />
    </StepSection>
  );
}
