import "server-only";
import { getSkill, listSkills, ok, type Result, type SkillDto } from "@bibi/core";
import { searchOperation } from "@/server/operations";
import { runOperation } from "@/server/run-operation";
import type { SkillFilters } from "./skill-filters";

export type SkillPage = { items: SkillDto[]; nextCursor: string | null };

const SEMANTIC_LIMIT = 20;

type SemanticInput = { query: string };

/** Skills ranked by meaning: core `search` (skill entities only), then each hit's skill. */
async function searchSkills({ query }: SemanticInput): Promise<Result<SkillPage>> {
  const found = await runOperation({
    operation: searchOperation(),
    input: { query, entityTypes: ["skill"], limit: SEMANTIC_LIMIT },
  });
  if (!found.ok) return found;
  const hits = (found.value as { hits: { entityId: string }[] }).hits;
  const loaded = await Promise.all(
    hits.map(({ entityId }) => runOperation({ operation: getSkill, input: { id: entityId } })),
  );
  const items = loaded.flatMap((result) => (result.ok ? [result.value] : []));
  return ok({ value: { items, nextCursor: null } });
}

export type LoadSkillsInput = { filters: SkillFilters };

/** The skills list for the filters: semantic search when asked for, otherwise `skill.list`. */
export async function loadSkills({ filters }: LoadSkillsInput): Promise<Result<SkillPage>> {
  const { scope, status, q, semantic, cursor } = filters;
  if (semantic && q) return searchSkills({ query: q });
  return runOperation({
    operation: listSkills,
    input: {
      limit: 20,
      ...(scope ? { scope } : {}),
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
      ...(cursor ? { cursor } : {}),
    },
  });
}
