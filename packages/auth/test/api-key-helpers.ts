import { createApiKey, execute } from "@okazi/core";
import { resolveExecuteContext } from "../src/index";

export type IssueKeyInput = { headers: Headers; role: string; name?: string };

/** `apiKey.create` as the signed-in session user, through the real caller resolution. */
export async function issueKey({ headers, role, name = "ci" }: IssueKeyInput) {
  const context = await resolveExecuteContext({ headers });
  if (!context.ok) throw context.error;
  return execute({ operation: createApiKey, input: { name, role }, context: context.value });
}

/** Like `issueKey`, but throws on failure and returns the secret and key id. */
export async function issueKeyOrThrow({ headers, role, name }: IssueKeyInput) {
  const created = await issueKey({ headers, role, ...(name ? { name } : {}) });
  if (!created.ok) throw created.error;
  return { key: created.value.secret, id: created.value.apiKey.id };
}

export const keyHeaders = ({ key }: { key: string }) => new Headers({ "x-api-key": key });
