import type { Prisma } from "@bibi/db";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { paginate } from "../../shared/paginate";
import { renderSkillMarkdown } from "../../skills/markdown/render-skill-markdown";
import { findVisibleSkill, visibleSkillWhere } from "./access";
import { contentOfSkill } from "./content-of-skill";
import { skillNotFound } from "./not-found";
import {
  SkillExportOutputSchema,
  SkillIdInputSchema,
  SkillListInputSchema,
  SkillListOutputSchema,
  SkillSchema,
} from "./schema";
import { toSkillDto } from "./to-skill-dto";

type TextFilterInput = { q: string | undefined };

function textFilter({ q }: TextFilterInput): Prisma.SkillWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: "insensitive" as const };
  return { OR: [{ name: contains }, { slug: contains }, { description: contains }] };
}

export const listSkills = defineOperation({
  name: "skill.list",
  kind: "query",
  description:
    "List skills you can use: SYSTEM skills shipped with Bibi, your organization's skills and " +
    "your personal ones. Filter by scope, status (e.g. PUBLISHED) and text.",
  input: SkillListInputSchema,
  output: SkillListOutputSchema,
  permission: "self:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.skill.findMany({
      where: {
        AND: [visibleSkillWhere({ userId: context.actor.userId }), textFilter({ q: input.q })],
        ...(input.scope ? { scope: input.scope } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    const items = rows.map((skill) => toSkillDto({ skill }));
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});

export const getSkill = defineOperation({
  name: "skill.get",
  kind: "query",
  description: "Get one skill by id, including its instructions, allowed tools and resources.",
  input: SkillIdInputSchema,
  output: SkillSchema,
  permission: "self:read",
  handler: async ({ input, context }) => {
    const skill = await findVisibleSkill({ context, id: input.id });
    return skill ? ok({ value: toSkillDto({ skill }) }) : skillNotFound();
  },
});

export const exportSkill = defineOperation({
  name: "skill.export",
  kind: "query",
  description: "Export a skill as a SKILL.md document (YAML frontmatter + markdown).",
  input: SkillIdInputSchema,
  output: SkillExportOutputSchema,
  permission: "self:read",
  handler: async ({ input, context }) => {
    const skill = await findVisibleSkill({ context, id: input.id });
    if (!skill) return skillNotFound();
    const markdown = renderSkillMarkdown({
      content: contentOfSkill({ skill }),
      version: skill.version,
    });
    return ok({ value: { markdown, filename: `${skill.slug}/SKILL.md` } });
  },
});
