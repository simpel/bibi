import type { Db } from "@okazi/db";
import { skillContentHash } from "../features/skill/content-hash";
import type { SkillContent } from "../features/skill/schema";
import { toJson } from "../shared/to-json";

export type UpsertSystemSkillInput = { db: Db; content: SkillContent; source: string };
export type UpsertSystemSkillOutcome = "created" | "updated" | "unchanged";

/**
 * Idempotent upsert of one SYSTEM skill by `source` (`system:<file>`). A content change bumps
 * the version; the row is always PUBLISHED. Uses the unscoped client on purpose: SYSTEM rows
 * have no organization and scopedDb can never write them.
 */
export async function upsertSystemSkill({
  db,
  content,
  source,
}: UpsertSystemSkillInput): Promise<UpsertSystemSkillOutcome> {
  const contentHash = skillContentHash({ content });
  const existing = await db.skill.findFirst({ where: { scope: "SYSTEM", source } });
  const data = {
    ...content,
    resources: toJson({ value: content.resources }) ?? [],
    contentHash,
    status: "PUBLISHED" as const,
  };
  if (!existing) {
    await db.skill.create({ data: { ...data, scope: "SYSTEM", source, version: 1 } });
    return "created";
  }
  const changed = existing.contentHash !== contentHash;
  if (!changed && existing.status === "PUBLISHED") return "unchanged";
  await db.skill.update({
    where: { id: existing.id },
    data: { ...data, version: changed ? existing.version + 1 : existing.version },
  });
  return "updated";
}
