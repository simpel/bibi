import { AppError, type ExecuteContext, err, ok, type Result } from "@okazi/core";

/** `resolveExecuteContext` from `@okazi/auth` in the web app; injectable for tests. */
export type ResolveContext = (input: { headers: Headers }) => Promise<Result<ExecuteContext>>;

/** Execute context of a signed-in human user (never the AI actor). */
export type UserContext = ExecuteContext & { actor: { type: "user"; userId: string } };

export type ResolveUserInput = { headers: Headers; resolveContext: ResolveContext };

/**
 * The assistant endpoints act for a *user* (cookie session). A request that resolves to the AI
 * actor (or a system actor) is refused, so the model can never reach these endpoints as itself.
 */
export async function resolveUser({
  headers,
  resolveContext,
}: ResolveUserInput): Promise<Result<UserContext>> {
  const resolved = await resolveContext({ headers });
  if (!resolved.ok) return resolved;
  const { actor } = resolved.value;
  if (actor.type !== "user" || !actor.userId) {
    const message = "The assistant endpoints are for signed-in users only";
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  const userId = actor.userId;
  return ok({ value: { ...resolved.value, actor: { ...actor, type: "user", userId } } });
}
