import { getDb } from "@bibi/db";

export type StoredMessagesInput = { conversationId: string; minCount?: number };

/** Messages of a conversation (unscoped, test-only), waiting briefly for background persistence. */
export async function storedMessages({ conversationId, minCount = 0 }: StoredMessagesInput) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const rows = await getDb().message.findMany({
      where: { conversationId },
      orderBy: { sequence: "asc" },
    });
    if (rows.length >= minCount) return rows;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`conversation ${conversationId} has fewer than ${minCount} messages`);
}

export type WaitForInput = { check: () => boolean; timeoutMs?: number };

export async function waitFor({ check, timeoutMs = 2000 }: WaitForInput): Promise<void> {
  const until = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() > until) throw new Error("condition not met in time");
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
