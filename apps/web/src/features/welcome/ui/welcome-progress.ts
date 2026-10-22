import type { WelcomeStep } from "../lib/welcome-step";
import type { WelcomeState } from "../load-welcome-state";

const SETUP_ORDER: readonly WelcomeStep[] = [
  "profile",
  "hours",
  "setup/organization",
  "setup/kind",
  "setup/bookable",
  "setup/sellable",
  "setup/review",
];

export type WelcomeProgressInput = {
  step: WelcomeStep;
  state: Pick<WelcomeState, "canSetup" | "organization">;
};

/** "Step n of m": 2 steps for a member, 7 for whoever sets up a pending organization. */
export function welcomeProgress({ step, state }: WelcomeProgressInput) {
  const setup = state.canSetup && state.organization.setupStatus === "PENDING";
  return { step: SETUP_ORDER.indexOf(step) + 1, total: setup ? SETUP_ORDER.length : 2 };
}
