import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type SystemSkillFile = { file: string; markdown: string };

export type LoadSystemSkillFilesInput = {
  /** Defaults to `packages/core/src/skills/system`. Bundled apps must pass (or copy) it. */
  directory?: string;
};

export const DEFAULT_SYSTEM_SKILLS_DIRECTORY = fileURLToPath(new URL("./system/", import.meta.url));

/** Reads the shipped SKILL.md files (`*.md`), sorted by file name. */
export async function loadSystemSkillFiles({
  directory = DEFAULT_SYSTEM_SKILLS_DIRECTORY,
}: LoadSystemSkillFilesInput = {}): Promise<SystemSkillFile[]> {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md")).sort();
  return Promise.all(
    files.map(async (file) => ({ file, markdown: await readFile(join(directory, file), "utf8") })),
  );
}
