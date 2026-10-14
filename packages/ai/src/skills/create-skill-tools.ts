import type { MCPClient } from "@ai-sdk/mcp";
import { createLoadSkillTool, LOAD_SKILL_TOOL } from "./load-skill-tool";
import { createSkillSearchTool, SKILL_SEARCH_TOOL } from "./skill-search-tool";
import type { PromptSkill } from "./skill-wire";
import type { ToolRestriction } from "./tool-restriction";

/** Local (non-MCP) assistant tools; they wrap MCP `search`/`skill_get` and never write. */
export const LOCAL_SKILL_TOOLS = [SKILL_SEARCH_TOOL, LOAD_SKILL_TOOL] as const;

export type CreateSkillToolsInput = {
  client: MCPClient;
  published: readonly PromptSkill[];
  restriction: ToolRestriction;
};

export function createSkillTools({ client, published, restriction }: CreateSkillToolsInput) {
  return {
    [SKILL_SEARCH_TOOL]: createSkillSearchTool({ client, published }),
    [LOAD_SKILL_TOOL]: createLoadSkillTool({ client, published, restriction }),
  };
}
