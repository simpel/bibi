import { createHash } from "node:crypto";
import type { SkillContent } from "./schema";

export type SkillContentHashInput = { content: SkillContent };

/** Stable hash of a skill's content; a change bumps `version` (seeder and skill.update). */
export function skillContentHash({ content }: SkillContentHashInput): string {
  const { slug, name, description, instructions, allowedTools, resources } = content;
  const canonical = JSON.stringify([slug, name, description, instructions, allowedTools, resources]);
  return createHash("sha256").update(canonical).digest("hex");
}
