import { providersWith } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import type { JobDefinition } from "../job-definition";

/**
 * Pulls changes from every configured provider without push (ADR 0100): each provider's `poll`
 * port re-reads what Bibi raised there. One provider's failure is logged and the others still run.
 */
export const providerPollJob: JobDefinition = {
  name: "provider.poll",
  cron: "*/15 * * * *",
  handler: async ({ db }) => {
    for (const adapter of providersWith({ capability: "poll" })) {
      const poll = adapter.signals?.poll;
      if (!poll || !adapter.isConfigured()) continue;
      const provider = adapter.key;
      try {
        const result = await poll.run({ db });
        if (result.ok) getLogger().info({ event: "provider.pollRun", provider, ...result.value });
        else getLogger().error({ event: "provider.pollFailed", provider, err: result.error });
      } catch (error) {
        getLogger().error({ event: "provider.pollFailed", provider, err: error });
      }
    }
  },
};
