import type { Dispatch } from "react";
import type { IntakeData } from "../load-intake-data";
import { type InputStep, type IntakeAction, type IntakeState, stepView } from "./intake-state";
import type { IntakeSummaries } from "./use-intake-summaries";

/** What every step section of the intake page gets. */
export type StepsProps = {
  data: IntakeData;
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
  summaries: IntakeSummaries;
};

export type SectionPropsInput = Pick<StepsProps, "state" | "dispatch"> & {
  step: InputStep;
  /** "Change", localised. */
  changeLabel: string;
};

/** A step section's state with Change, which reopens the step and keeps later answers. */
export const sectionProps = ({ state, dispatch, step, changeLabel }: SectionPropsInput) => ({
  state: stepView({ state, step }),
  changeLabel,
  onChangeStep: () => dispatch({ type: "change", step }),
});
