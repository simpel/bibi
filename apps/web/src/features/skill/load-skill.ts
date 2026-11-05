import "server-only";
import { getSkill, type Result, type SkillDto } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadSkillCached = cache(async (id: string): Promise<Result<SkillDto>> => {
  return runOperation({ operation: getSkill, input: { id } });
});

export type LoadSkillInput = { id: string };

/** The skill by its id, cached per request so metadata and page components share one read. */
export function loadSkill({ id }: LoadSkillInput): Promise<Result<SkillDto>> {
  return loadSkillCached(id);
}
