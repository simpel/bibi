import type { MCPClient } from "@ai-sdk/mcp";
import type { ToolSet } from "ai";
import { createSkillTools, LOCAL_SKILL_TOOLS } from "../skills/create-skill-tools";
import { guardTools } from "../skills/guard-tools";
import { listPublishedSkills, rankSkills } from "../skills/list-prompt-skills";
import { markUntrustedTools } from "../skills/mark-untrusted-tools";
import type { PromptSkill } from "../skills/skill-wire";
import { createToolRestriction, type ToolRestriction } from "../skills/tool-restriction";
import { ASSISTANT_LIMITS } from "./assistant-limits";

/** Human-only tools; apps/mcp already hides them from the AI actor, dropped again defensively. */
export const HUMAN_ONLY_TOOLS: readonly string[] = ["approval_confirm"];

export type PreparedTools = {
  tools: ToolSet;
  restriction: ToolRestriction;
  promptSkills: PromptSkill[];
};

export type PrepareToolsInput = { client: MCPClient; userText: string };

const omit = ({ tools, names }: { tools: ToolSet; names: readonly string[] }): ToolSet =>
  Object.fromEntries(Object.entries(tools).filter(([name]) => !names.includes(name)));

/**
 * The run's tool set: the MCP tools the AI actor sees (`tools/list`) + local skill tools, guarded
 * by the skill restriction; plus the PUBLISHED skills listed in the prompt.
 */
export async function prepareTools({
  client,
  userText,
}: PrepareToolsInput): Promise<PreparedTools> {
  const mcpTools = omit({
    tools: await client.tools(),
    names: [...HUMAN_ONLY_TOOLS, ...LOCAL_SKILL_TOOLS],
  });
  const published = await listPublishedSkills({ client });
  const promptSkills = await rankSkills({
    client,
    skills: published,
    query: userText,
    limit: ASSISTANT_LIMITS.maxPromptSkills,
  });
  const restriction = createToolRestriction({
    available: [...Object.keys(mcpTools), ...LOCAL_SKILL_TOOLS],
    alwaysAllowed: LOCAL_SKILL_TOOLS,
  });
  const skillTools = createSkillTools({ client, published, restriction });
  const guarded = guardTools({ tools: { ...mcpTools, ...skillTools }, restriction });
  const tools = markUntrustedTools({ tools: guarded });
  return { tools, restriction, promptSkills };
}
