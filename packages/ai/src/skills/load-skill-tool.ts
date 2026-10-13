import type { MCPClient } from "@ai-sdk/mcp";
import { tool } from "ai";
import { z } from "zod";
import { callMcpTool } from "../mcp/call-mcp-tool";
import { type PromptSkill, SkillDetailWireSchema } from "./skill-wire";
import type { ToolRestriction } from "./tool-restriction";

export const LOAD_SKILL_TOOL = "load_skill";

export const LoadSkillInputSchema = z
  .object({
    id: z.string().min(1).max(200).optional().describe("Skill id"),
    slug: z.string().min(1).max(64).optional().describe("Skill slug, e.g. create-venue-with-rooms"),
  })
  .refine((value) => value.id !== undefined || value.slug !== undefined, "Give id or slug");

export type CreateLoadSkillToolInput = {
  client: MCPClient;
  published: readonly PromptSkill[];
  restriction: ToolRestriction;
};

type ResolveIdInput = { id?: string; slug?: string; published: readonly PromptSkill[] };

const resolveId = ({ id, slug, published }: ResolveIdInput): string | undefined =>
  id ?? published.find((skill) => skill.slug === slug)?.id;

/**
 * Local tool: loads a PUBLISHED skill's instructions + resources (progressive disclosure) and
 * restricts the rest of the run to the skill's `allowedTools` ∩ the user's tools.
 */
export function createLoadSkillTool({ client, published, restriction }: CreateLoadSkillToolInput) {
  return tool({
    description:
      "Load a skill's full instructions before following it. After loading, only the tools the " +
      "skill allows stay available for the rest of this answer.",
    inputSchema: LoadSkillInputSchema,
    execute: async ({ id, slug }) => {
      const skillId = resolveId({ id, slug, published });
      if (!skillId) return { error: "NOT_FOUND: no published skill with that slug" };
      const result = await callMcpTool({ client, name: "skill_get", args: { id: skillId } });
      if (!result.ok) return { error: `${result.error.code}: ${result.error.message}` };
      const skill = SkillDetailWireSchema.safeParse(result.value);
      if (!skill.success || skill.data.status !== "PUBLISHED") {
        return { error: "NOT_FOUND: only published skills can be loaded" };
      }
      const { instructions, resources, allowedTools } = skill.data;
      const activeTools = restriction.activate({ allowedTools });
      const { id: loadedId, slug: loadedSlug, name, version } = skill.data;
      return {
        id: loadedId,
        slug: loadedSlug,
        name,
        version,
        instructions,
        resources,
        activeTools,
      };
    },
  });
}
