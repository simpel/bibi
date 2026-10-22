import type { MCPClient } from "@ai-sdk/mcp";
import { tool } from "ai";
import { z } from "zod";
import { callMcpTool } from "../mcp/call-mcp-tool";
import { type PromptSkill, SearchWireSchema } from "./skill-wire";

export const SKILL_SEARCH_TOOL = "skill_search";

export const SkillSearchInputSchema = z.object({
  query: z.string().trim().min(1).max(500).describe("What the user wants to do, any language"),
});

export type CreateSkillSearchToolInput = {
  client: MCPClient;
  /** PUBLISHED skills the user may load; hits outside this list are dropped. */
  published: readonly PromptSkill[];
};

/** Local tool: finds PUBLISHED skills by meaning (MCP `search`, entity type `skill`). */
export function createSkillSearchTool({ client, published }: CreateSkillSearchToolInput) {
  const byId = new Map(published.map((skill) => [skill.id, skill]));
  return tool({
    description:
      "Find a skill (a saved, step-by-step way of doing a task in Bibi) for what the user wants. " +
      "Returns id, slug, name and description; call load_skill to get its instructions.",
    inputSchema: SkillSearchInputSchema,
    execute: async ({ query }) => {
      const result = await callMcpTool({
        client,
        name: "search",
        args: { query, entityTypes: ["skill"], limit: 20 },
      });
      if (!result.ok) return { skills: [], error: result.error.message };
      const hits = SearchWireSchema.safeParse(result.value).data?.hits ?? [];
      const skills = hits.flatMap((hit) => byId.get(hit.entityId) ?? []).slice(0, 10);
      return { skills };
    },
  });
}
