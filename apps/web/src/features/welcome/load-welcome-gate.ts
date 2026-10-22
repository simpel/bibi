import "server-only";
import { getLogger } from "@bibi/logger";
import { unstable_rethrow } from "next/navigation";
import { loadWelcomeState } from "./load-welcome-state";

/**
 * Whether the app layout must send the member to `/:org/welcome` first (ADR 0061): an open
 * profile or hours step, or a pending setup they can do. The waiting page ("done") does not
 * block the app. On any error the app opens, so a broken read never locks members out.
 */
export async function mustWelcomeFirst(): Promise<boolean> {
  try {
    const state = await loadWelcomeState();
    if (!state.ok) return false;
    return state.value.next !== null && state.value.next !== "done";
  } catch (error) {
    unstable_rethrow(error);
    getLogger().warn({ event: "welcome.gateFailed", err: error });
    return false;
  }
}
