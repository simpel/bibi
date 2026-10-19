import { ASK_QUESTION_TOOL } from "../questions/ask-question-tool";
import { LOCAL_SKILL_TOOLS } from "../skills/create-skill-tools";

/** Every local (non-MCP) tool of a run; none of them writes, so a skill never restricts them. */
export const LOCAL_TOOLS: readonly string[] = [...LOCAL_SKILL_TOOLS, ASK_QUESTION_TOOL];
