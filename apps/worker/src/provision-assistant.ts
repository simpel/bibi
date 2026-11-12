import { provisionAssistantClient } from "@bibi/auth/provision";
import { getEnv } from "@bibi/config";
import type { Db } from "@bibi/db";
import { getLogger } from "@bibi/logger";

/**
 * Keeps the assistant's OAuth client in step with `WEB_OAUTH_CLIENT_ID` on every start, so
 * production needs no `provision:oauth` run (its image has no tsx). Unset = the assistant is off.
 * A failure is logged and the worker keeps running: jobs matter more than the assistant.
 */
export async function provisionAssistant({ db }: { db: Db }): Promise<void> {
  if (!getEnv().WEB_OAUTH_CLIENT_ID) return;
  try {
    const clientId = await provisionAssistantClient({ db });
    getLogger().info({ event: "assistant.clientProvisioned", clientId });
  } catch (error: unknown) {
    getLogger().error({ event: "assistant.clientProvisionFailed", err: error });
  }
}
