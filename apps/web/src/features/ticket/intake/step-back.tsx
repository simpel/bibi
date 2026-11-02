import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Dispatch } from "react";
import type { IntakeAction, IntakeState, IntakeStep } from "./intake-state";
import { previousStep } from "./openable-step";

export type StepBackProps = {
  step: IntakeStep;
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
};

/**
 * A step's Back, bottom left: opens the previous step like its Change (answers kept, the URL
 * follows). Step 1 has none.
 */
export function StepBack({ step, state, dispatch }: StepBackProps) {
  const t = useTranslations("ticketIntake");
  const previous = previousStep({ state, step });
  if (!previous) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => dispatch({ type: "change", step: previous })}
    >
      {t("back")}
    </Button>
  );
}
