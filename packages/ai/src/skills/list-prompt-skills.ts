import type { MCPClient } from "@ai-sdk/mcp";
import { callMcpTool } from "../mcp/call-mcp-tool";
import { type PromptSkill, SearchWireSchema, SkillListWireSchema } from "./skill-wire";

/** Upper bound of PUBLISHED skills fetched per run (system + org + own personal). */
const LIST_LIMIT = 100;

export type ListPublishedSkillsInput = { client: MCPClient };

/** PUBLISHED skills visible to the user, via MCP `skill_list` (visibility enforced by core). */
export async function listPublishedSkills({ client }: ListPublishedSkillsInput): Promise<PromptSkill[]> {
  const result = await callMcpTool({
    client,
    name: "skill_list",
    args: { status: "PUBLISHED", limit: LIST_LIMIT },
  });
  if (!result.ok) return [];
  const parsed = SkillListWireSchema.safeParse(result.value);
  if (!parsed.success) return [];
  return parsed.data.items.map(({ id, slug, name, description, scope }) => ({
    id,
    slug,
    name,
    description,
    scope,
  }));
}

export type RankSkillsInput = {
  client: MCPClient;
  skills: readonly PromptSkill[];
  query: string;
  limit: number;
};

/**
 * The `limit` skills most relevant to `query` (hybrid search over skills), filled up in list order.
 * Search failures fall back to list order: the prompt never blocks on search.
 */
export async function rankSkills({ client, skills, query, limit }: RankSkillsInput): Promise<PromptSkill[]> {
  if (skills.length <= limit || query.trim() === "") return skills.slice(0, limit);
  const result = await callMcpTool({
    client,
    name: "search",
    args: { query: query.slice(0, 500), entityTypes: ["skill"], limit: 50 },
  });
  const hits = result.ok ? (SearchWireSchema.safeParse(result.value).data?.hits ?? []) : [];
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const ranked = hits.flatMap((hit) => byId.get(hit.entityId) ?? []);
  const rest = skills.filter((skill) => !ranked.includes(skill));
  return [...new Set([...ranked, ...rest])].slice(0, limit);
}
