import "server-only";
import { listMemberProfiles, listMembers } from "@bibi/core";
import { runOperation } from "@/server/run-operation";

const LIMIT = 100;

export type LoadUnitMembersInput = { unitIds: readonly string[] };

/**
 * Staff item id → name of the member behind it (ADR 0068): one profile list for all units, one
 * member list. Empty when nobody is linked or the caller may not read members.
 */
export async function loadUnitMembers({
  unitIds,
}: LoadUnitMembersInput): Promise<ReadonlyMap<string, string>> {
  const itemIds = [...new Set(unitIds)].slice(0, LIMIT);
  if (itemIds.length === 0) return new Map();
  const profiles = await runOperation({
    operation: listMemberProfiles,
    input: { itemIds, limit: LIMIT },
  });
  if (!profiles.ok || profiles.value.items.length === 0) return new Map();
  const members = await runOperation({ operation: listMembers, input: { limit: LIMIT } });
  if (!members.ok) return new Map();
  const names = new Map(members.value.items.map(({ id, name }) => [id, name]));
  return new Map(
    profiles.value.items.flatMap(({ memberId, items }) => {
      const name = names.get(memberId);
      return name ? items.map(({ itemId }) => [itemId, name] as const) : [];
    }),
  );
}
