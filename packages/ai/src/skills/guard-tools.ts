import type { ToolSet } from "ai";
import type { ToolRestriction } from "./tool-restriction";

export type GuardToolsInput<T extends ToolSet> = { tools: T; restriction: ToolRestriction };

const refusal = ({ name }: { name: string }) => ({
  isError: true,
  content: [{ type: "text", text: `FORBIDDEN: ${name} is not allowed by the loaded skill` }],
  structuredContent: { code: "FORBIDDEN", message: `${name} is not allowed by the loaded skill` },
});

/**
 * Defense in depth next to `activeTools`: a call to a tool outside the active skill restriction is
 * answered with an MCP-style error instead of being executed.
 */
export function guardTools<T extends ToolSet>({ tools, restriction }: GuardToolsInput<T>): T {
  const guarded: ToolSet = {};
  for (const [name, original] of Object.entries(tools)) {
    const execute = original.execute;
    if (!execute) {
      guarded[name] = original;
      continue;
    }
    guarded[name] = {
      ...original,
      execute: (input, options) =>
        restriction.isAllowed({ name }) ? execute(input, options) : refusal({ name }),
    };
  }
  return guarded as T;
}
