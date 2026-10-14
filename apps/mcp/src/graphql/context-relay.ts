import { randomUUID } from "node:crypto";
import { appError, type ExecuteContext, err, ok, type Result } from "@okazi/core";

export const RELAY_HEADER = "x-okazi-mcp-relay";

const pending = new Map<string, ExecuteContext>();

export type RelayInput = { context: ExecuteContext };

/** Hands the caller's context to the in-process GraphQL handler for exactly one request. */
export function holdContext({ context }: RelayInput): { id: string; release(): void } {
  const id = randomUUID();
  pending.set(id, context);
  return { id, release: () => pending.delete(id) };
}

export type ResolveRelayInput = { headers: Headers };

/** `resolveContext` for the GraphQL handler: looks the held context up by the relay header. */
export async function resolveRelayedContext({
  headers,
}: ResolveRelayInput): Promise<Result<ExecuteContext>> {
  const context = pending.get(headers.get(RELAY_HEADER) ?? "");
  if (context) return ok({ value: context });
  return err({ error: appError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
}
