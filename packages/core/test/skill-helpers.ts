import { createSkill, type ExecuteContext, execute, listSkills } from "../src/index";
import { unwrap } from "./helpers";

export type NewSkillInput = {
  context: ExecuteContext;
  scope?: "PERSONAL" | "ORGANIZATION";
  name?: string;
};

export async function newSkill({
  context,
  scope = "PERSONAL",
  name = "Quote support",
}: NewSkillInput) {
  const input = { scope, name, description: "Helps with quotes", instructions: "# Steps" };
  return unwrap({ result: await execute({ operation: createSkill, input, context }) });
}

export type IdsInput = { context: ExecuteContext; scope?: "SYSTEM" | "ORGANIZATION" | "PERSONAL" };

/** Ids of the skills `context` can list (optionally one scope). */
export async function visibleIds({ context, scope }: IdsInput): Promise<string[]> {
  const input = { limit: 100, ...(scope ? { scope } : {}) };
  const page = unwrap({ result: await execute({ operation: listSkills, input, context }) });
  return page.items.map((item) => item.id);
}
