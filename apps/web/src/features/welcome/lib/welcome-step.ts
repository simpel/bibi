/** The pages under `/:org/welcome` (ADR 0061), in the order the router walks them. */
export const WELCOME_STEPS = [
  "profile",
  "hours",
  "setup/organization",
  "setup/kind",
  "setup/bookable",
  "setup/sellable",
  "setup/review",
  "done",
] as const;

export type WelcomeStep = (typeof WELCOME_STEPS)[number];

export type SetupStatus = "PENDING" | "COMPLETED" | "SKIPPED";

export type NextWelcomeStepInput = {
  /** Name and phone are set. */
  profileComplete: boolean;
  /** At least one working day is saved. */
  hoursSet: boolean;
  setupStatus: SetupStatus;
  /** The member may do the setup (`pipeline:write`). */
  canSetup: boolean;
};

/**
 * Where `/:org/welcome` sends a member next, or `null` when nothing is left and the app opens.
 * Profile first for everyone; the setup only for members who can do it while it is pending.
 */
export function nextWelcomeStep({
  profileComplete,
  hoursSet,
  setupStatus,
  canSetup,
}: NextWelcomeStepInput): WelcomeStep | null {
  if (!profileComplete) return "profile";
  if (!hoursSet) return "hours";
  if (setupStatus !== "PENDING") return null;
  return canSetup ? "setup/organization" : "done";
}

export type WelcomePathInput = { step?: WelcomeStep };

/** `/welcome/<step>`; pass the organization to the navigation wrapper to get `/:org/...`. */
export function welcomePath({ step }: WelcomePathInput = {}): string {
  return step ? `/welcome/${step}` : "/welcome";
}
