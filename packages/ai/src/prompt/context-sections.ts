import type { PromptSkill } from "../skills/skill-wire";
import type { PageContext } from "./page-context-schema";

const MAX_DESCRIPTION = 300;

/** JSON keeps client-supplied strings inert (no way to close a section or add rules). */
const asData = ({ value }: { value: unknown }): string => JSON.stringify(value);

export type ContextSectionInput = { organizationId: string; page?: PageContext; now: Date };

export function contextSection({ organizationId, page, now }: ContextSectionInput): string {
  const lines = [
    "## Context (data)",
    `- Organization id: ${asData({ value: organizationId })}`,
    `- Current time (UTC): ${now.toISOString()}`,
  ];
  if (page) {
    lines.push(`- Page route: ${asData({ value: page.route })}`);
    if (page.entity) lines.push(`- Entity on page: ${asData({ value: page.entity })}`);
  }
  return lines.join("\n");
}

export type SkillsSectionInput = { skills: readonly PromptSkill[] };

/** Progressive disclosure: names + descriptions only; instructions come from `load_skill`. */
export function skillsSection({ skills }: SkillsSectionInput): string {
  if (skills.length === 0) return "## Skills\nNo published skills are available.";
  const items = skills.map((skill) => {
    const description = skill.description.slice(0, MAX_DESCRIPTION);
    return `- ${asData({ value: { slug: skill.slug, name: skill.name, scope: skill.scope, description } })}`;
  });
  return [
    "## Skills (data)",
    "Load one with `load_skill({ slug })` when it fits; `skill_search` finds others.",
    ...items,
  ].join("\n");
}
