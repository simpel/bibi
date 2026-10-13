import type { SkillContent } from "../../features/skill/schema";
import { renderResourceBlocks } from "./resource-blocks";

export type RenderSkillMarkdownInput = { content: SkillContent; version?: number };

/**
 * Skill → SKILL.md (Agent Skills layout). Strings are written as JSON strings, which are valid
 * YAML double-quoted scalars, so `parseSkillMarkdown` round-trips them exactly.
 */
export function renderSkillMarkdown({ content, version }: RenderSkillMarkdownInput): string {
  const lines = [
    "---",
    `name: ${content.slug}`,
    `description: ${JSON.stringify(content.description)}`,
    ...(content.allowedTools.length > 0 ? [`allowed-tools: ${content.allowedTools.join(" ")}`] : []),
    "metadata:",
    `  title: ${JSON.stringify(content.name)}`,
    ...(version === undefined ? [] : [`  version: "${version}"`]),
    "---",
    "",
    content.instructions.trim(),
    "",
  ];
  const resources = renderResourceBlocks({ resources: content.resources });
  return resources === "" ? lines.join("\n") : `${lines.join("\n")}\n${resources}\n`;
}
