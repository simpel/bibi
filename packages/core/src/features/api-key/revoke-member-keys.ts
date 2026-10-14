import type { OperationContext } from "../../operations/types";
import { API_KEY_SELECT, parseKeyMetadata, toApiKeyDto } from "./to-api-key-dto";

export type RevokeMemberKeysInput = {
  context: Pick<OperationContext, "db" | "recordChange">;
  userId: string;
  ownerName: string | null;
};

/**
 * Revokes every active key a member owns in this organization (#92): a removed member's keys
 * must not look live, nor come back to life if the person is added again. Each revoked key is
 * audited as an `apiKey` change on the removal.
 */
export async function revokeMemberKeys({
  context,
  userId,
  ownerName,
}: RevokeMemberKeysInput): Promise<number> {
  const rows = await context.db.apikey.findMany({
    where: { enabled: true },
    select: API_KEY_SELECT,
  });
  const owned = rows.filter(
    (row) => parseKeyMetadata({ metadata: row.metadata })?.userId === userId,
  );
  if (owned.length === 0) return 0;
  await context.db.apikey.updateMany({
    where: { id: { in: owned.map((row) => row.id) } },
    data: { enabled: false, updatedAt: new Date() },
  });
  for (const row of owned) {
    const before = toApiKeyDto({ row, ownerName });
    context.recordChange({ entityType: "apiKey", entityId: row.id, before });
  }
  return owned.length;
}
