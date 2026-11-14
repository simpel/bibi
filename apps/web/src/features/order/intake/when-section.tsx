import { Button, StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { slotWhen } from "./intake-slot";
import { type StepsProps, sectionProps } from "./section-props";
import { StepBack } from "./step-back";
import { WHEN_FORM_ID, WhenStep } from "./when-step";

/**
 * Step 2 with Back (bottom left) and Next (bottom right; submits, back to review once lines
 * exist). Next waits until the day, times and guests pass the step's rules. A message's read
 * values or the calendar's slot prefill it.
 */
export function WhenSection({ data, state, dispatch, summaries }: StepsProps) {
  const t = useTranslations("orderIntake");
  const { when } = state;
  const [valid, setValid] = useState(false);
  const onValidChange = useCallback(({ valid: next }: { valid: boolean }) => setValid(next), []);
  return (
    <StepSection
      number={2}
      title={t("when.title")}
      summary={summaries.when}
      {...sectionProps({ state, dispatch, step: "when", changeLabel: t("change") })}
      footerStart={<StepBack step="when" state={state} dispatch={dispatch} />}
      footerEnd={
        <Button type="submit" form={WHEN_FORM_ID} disabled={!valid}>
          {t("next")}
        </Button>
      }
    >
      <WhenStep
        key={state.draft ? "read" : "typed"}
        when={when}
        prefill={state.draft?.when ?? (data.slot ? slotWhen({ slot: data.slot }) : null)}
        onDone={({ when: next }) => dispatch({ type: "setWhen", when: next })}
        onValidChange={onValidChange}
      />
    </StepSection>
  );
}
