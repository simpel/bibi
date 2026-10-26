import "server-only";
import { listMemberProfiles, listMembers } from "@bibi/core";
import { runOperation } from "@/server/run-operation";

const LIMIT = 100;

export type LoadUnitMembersInput = { unitIds: readonly string[] };

/** The member behind a staff item and how colleagues here reach them (ADR 0068, 0072). */
export type UnitPerson = {
  memberId: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatarKey: string | null;
};

/**
 * Staff item id → the member behind it: one profile list for all units, one member list. Empty
 * when nobody is linked or the caller may not read members.
 */
export async function loadUnitPeople({
  unitIds,
}: LoadUnitMembersInput): Promise<ReadonlyMap<string, UnitPerson>> {
  const itemIds = [...new Set(unitIds)].slice(0, LIMIT);
  if (itemIds.length === 0) return new Map();
  const profiles = await runOperation({
    operation: listMemberProfiles,
    input: { itemIds, limit: LIMIT },
  });
  if (!profiles.ok || profiles.value.items.length === 0) return new Map();
  const members = await runOperation({ operation: listMembers, input: { limit: LIMIT } });
  if (!members.ok) return new Map();
  const byId = new Map(members.value.items.map((member) => [member.id, member]));
  return new Map(
    profiles.value.items.flatMap(({ memberId, items, phone, email, avatarKey }) => {
      const member = byId.get(memberId);
      if (!member) return [];
      const person = {
        memberId,
        name: member.name,
        phone,
        email: email ?? member.email,
        avatarKey,
      };
      return items.map(({ itemId }) => [itemId, person] as const);
    }),
  );
}

/** Staff item id → name of the member behind it (ADR 0068). */
export async function loadUnitMembers({
  unitIds,
}: LoadUnitMembersInput): Promise<ReadonlyMap<string, string>> {
  const people = await loadUnitPeople({ unitIds });
  return new Map([...people].map(([itemId, person]) => [itemId, person.name]));
}
