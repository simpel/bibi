import type { OperationContext } from "../../operations/types";
import { generateApiKey } from "./key-secret";
import { API_KEY_PREFIX, API_KEY_RATE_LIMIT } from "./schema";
import { API_KEY_SELECT, type ApiKeyRow } from "./to-api-key-dto";

export type InsertApiKeyInput = {
  context: OperationContext;
  id: string;
  userId: string;
  name: string;
  role: string;
  expiresInDays?: number | undefined;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Writes the row the Better Auth API key plugin verifies (same hash, prefix, `start` and rate
 * limit). Only the hash is stored; the plain key is returned to the caller once.
 */
export async function insertApiKey({
  context,
  id,
  userId,
  name,
  role,
  expiresInDays,
}: InsertApiKeyInput): Promise<{ row: ApiKeyRow; secret: string }> {
  const { key, hash, start } = generateApiKey();
  const now = new Date();
  const row = await context.db.apikey.create({
    data: {
      id,
      organizationId: context.organizationId,
      name,
      start,
      prefix: API_KEY_PREFIX,
      key: hash,
      enabled: true,
      rateLimitEnabled: true,
      rateLimitTimeWindow: API_KEY_RATE_LIMIT.timeWindow,
      rateLimitMax: API_KEY_RATE_LIMIT.maxRequests,
      requestCount: 0,
      expiresAt: expiresInDays ? new Date(now.getTime() + expiresInDays * DAY_MS) : null,
      metadata: JSON.stringify({ userId, role }),
      createdAt: now,
      updatedAt: now,
    },
    select: API_KEY_SELECT,
  });
  return { row, secret: key };
}
