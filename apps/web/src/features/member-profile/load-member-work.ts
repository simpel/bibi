import "server-only";
import {
  type EntityTypeDto,
  getMemberProfile,
  listEntityTypes,
  listItems,
  type MemberProfileDto,
  type Result,
} from "@bibi/core";
import { runOperation } from "@/server/run-operation";

const LIMIT = 100;

/** A staff item the member can be linked to, with the name of its type (the position). */
export type StaffOption = { id: string; name: string; typeName: string };

export type MemberWorkView = {
  profile: MemberProfileDto;
  /** Distinct type names of the linked staff items; empty when the caller may not read types. */
  positions: string[];
  /** Active items of PERSON types; empty unless asked for. */
  options: StaffOption[];
};

export type LoadMemberWorkInput = { memberId: string; withOptions: boolean };

type OptionsInput = { types: readonly EntityTypeDto[] };

/** Active staff items, one list call per PERSON type. */
async function staffOptions({ types }: OptionsInput): Promise<StaffOption[]> {
  const persons = types.filter((type) => type.resourceKind === "PERSON");
  const lists = await Promise.all(
    persons.map((type) =>
      runOperation({ operation: listItems, input: { entityTypeId: type.id, limit: LIMIT } }),
    ),
  );
  return lists.flatMap((list, index) =>
    list.ok
      ? list.value.items
          .filter(({ status }) => status === "ACTIVE")
          .map(({ id, name }) => ({ id, name, typeName: persons[index]?.name ?? "–" }))
      : [],
  );
}

/** The member's profile with type names for the positions (configuration:read, else none). */
export async function loadMemberWork({
  memberId,
  withOptions,
}: LoadMemberWorkInput): Promise<Result<MemberWorkView>> {
  const profile = await runOperation({ operation: getMemberProfile, input: { memberId } });
  if (!profile.ok) return profile;
  const types = await runOperation({
    operation: listEntityTypes,
    input: { base: "ITEM", limit: LIMIT },
  });
  const known = types.ok ? types.value.items : [];
  const names = new Map(known.map(({ id, name }) => [id, name]));
  const positions = [
    ...new Set(profile.value.items.flatMap(({ entityTypeId }) => names.get(entityTypeId) ?? [])),
  ];
  const options = withOptions ? await staffOptions({ types: known }) : [];
  return { ok: true, value: { profile: profile.value, positions, options } };
}
