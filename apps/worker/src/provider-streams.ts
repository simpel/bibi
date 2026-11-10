import { providersWith, type StreamHandle } from "@bibi/core";
import type { Db } from "@bibi/db";
import { getLogger } from "@bibi/logger";

/**
 * Every configured provider's stream (ADR 0090, 0100): first a catch-up for one that was away
 * longer than it replays, then its long-lived connection. One provider's failed catch-up is
 * logged and does not keep its stream, or another's, from starting.
 */
export async function startProviderStreams({ db }: { db: Db }): Promise<StreamHandle[]> {
  const handles: StreamHandle[] = [];
  for (const adapter of providersWith({ capability: "stream" })) {
    const stream = adapter.signals?.stream;
    if (!stream?.isConfigured()) continue;
    const provider = adapter.key;
    try {
      const caught = await stream.catchUp({ db });
      if (caught.ok) getLogger().info({ event: "provider.catchUpRun", provider, ...caught.value });
      else getLogger().error({ event: "provider.catchUpFailed", provider, err: caught.error });
    } catch (error) {
      getLogger().error({ event: "provider.catchUpFailed", provider, err: error });
    }
    handles.push(stream.start());
    getLogger().info({ event: "provider.streamStarted", provider });
  }
  return handles;
}
