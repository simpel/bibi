import "server-only";
import { getOrganizationProfile, type SetupStatus } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { unstable_rethrow } from "next/navigation";
import { runOperation } from "@/server/run-operation";

/**
 * Where the active organization is in its first setup (ADR 0061), or `null` when it cannot be
 * read. A convenience for routing: on any error the app renders as if nothing is pending, so it
 * never throws (Next's own control-flow errors are rethrown).
 */
export async function loadSetupStatus(): Promise<SetupStatus | null> {
  try {
    const result = await runOperation({ operation: getOrganizationProfile, input: {} });
    return result.ok ? result.value.setupStatus : null;
  } catch (error) {
    unstable_rethrow(error);
    getLogger().warn({ event: "organizationProfile.loadFailed", err: error });
    return null;
  }
}
