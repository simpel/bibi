import { type Db, getDb } from "@okazi/db";
import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import type { SkillContent } from "../features/skill/schema";
import type { EmbedFn } from "../search/embed";
import { indexSystemSkills } from "./index-system-skills";
import { parseSkillMarkdown } from "./markdown/parse-skill-markdown";
import { DEFAULT_SYSTEM_SKILLS_DIRECTORY, loadSystemSkillFiles } from "./system-skill-files";

export { DEFAULT_SYSTEM_SKILLS_DIRECTORY };
import { upsertSystemSkill } from "./upsert-system-skill";

export type SeedSystemSkillsInput = {
  /** Unscoped client; defaults to the process singleton. */
  db?: Db;
  /** When given, SYSTEM skills are (re)indexed for search. */
  embed?: EmbedFn;
  /** Directory with the SKILL.md files; defaults to `src/skills/system`. */
  directory?: string;
};

export type SeedSystemSkillsOutput = {
  created: string[];
  updated: string[];
  unchanged: string[];
  archived: string[];
};

type Parsed = { source: string; content: SkillContent };

async function parseAll({ directory }: { directory?: string }): Promise<Result<Parsed[]>> {
  const parsed: Parsed[] = [];
  for (const { file, markdown } of await loadSystemSkillFiles(directory ? { directory } : {})) {
    const result = parseSkillMarkdown({ markdown });
    if (!result.ok) {
      const message = `System skill ${file}: ${result.error.message}`;
      return err({ error: new AppError({ code: "VALIDATION", message, issues: result.error.issues }) });
    }
    parsed.push({ source: `system:${file}`, content: result.value });
  }
  return ok({ value: parsed });
}

/**
 * Seeds the SKILL.md files shipped in the repo as SYSTEM skills: idempotent upsert by source,
 * version bump on content change, removed files archived. The only writer of SYSTEM skills.
 * Run via `pnpm --filter @okazi/core seed:skills` or at app startup (import from the
 * `@okazi/core/seed` subpath: it reads files, so it is kept out of the bundle-safe index).
 */
export async function seedSystemSkills({
  db = getDb(),
  embed,
  directory,
}: SeedSystemSkillsInput = {}): Promise<Result<SeedSystemSkillsOutput>> {
  const parsed = await parseAll(directory ? { directory } : {});
  if (!parsed.ok) return parsed;
  const out: SeedSystemSkillsOutput = { created: [], updated: [], unchanged: [], archived: [] };
  for (const { source, content } of parsed.value) {
    out[await upsertSystemSkill({ db, content, source })].push(content.slug);
  }
  const sources = parsed.value.map((entry) => entry.source);
  const removed = await db.skill.findMany({
    where: { scope: "SYSTEM", status: { not: "ARCHIVED" }, source: { notIn: sources } },
  });
  await db.skill.updateMany({
    where: { id: { in: removed.map((skill) => skill.id) } },
    data: { status: "ARCHIVED" },
  });
  out.archived = removed.map((skill) => skill.slug);
  if (embed) await indexSystemSkills({ db, embed });
  return ok({ value: out });
}
