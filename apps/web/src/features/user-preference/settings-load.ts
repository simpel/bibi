import "server-only";
import { getUserSettings, type OnboardingStatus } from "@okazi/core";
import { getLogger } from "@okazi/logger";
import { unstable_rethrow } from "next/navigation";
import { runOperation } from "@/server/run-operation";

/**
 * Where the signed-in user is in the first setup (ADR 0046), or `null` when it never applied.
 * Like preferences this is a convenience: on any error the app renders as if nothing is pending,
 * so it never throws (Next's own control-flow errors are rethrown).
 */
export async function loadOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const result = await runOperation({ operation: getUserSettings, input: {} });
    return result.ok ? result.value.onboardingStatus : null;
  } catch (error) {
    unstable_rethrow(error);
    getLogger().warn({ event: "userSettings.loadFailed", err: error });
    return null;
  }
}
