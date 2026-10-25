import "server-only";
import { invitationMailHook, resolveExecuteContext } from "@bibi/auth";
import {
  createIndexingHook,
  type ExecuteContext,
  execute,
  type Operation,
  type Result,
} from "@bibi/core";
import { runWithLogContext } from "@bibi/logger";
import { headers } from "next/headers";
import type { z } from "zod";
import { embed } from "./embed";
import { ensureOperations } from "./operations";
import { webLogContext } from "./request-log-context";

export type RunOperationInput<I extends z.ZodType, O extends z.ZodType> = {
  operation: Operation<I, O>;
  input: z.input<I>;
};

const afterCommit = [createIndexingHook({ embed }), invitationMailHook];

/**
 * THE web data-access layer (ADR 0010). Every server component and server action runs core
 * operations through here: the caller comes from the session cookie via `resolveExecuteContext`
 * (same resolver as GraphQL/REST/MCP), then core `execute` validates, authorizes, audits, logs
 * (ADR 0014) and triggers search indexing and the invitation mail. Never import `@bibi/db` or build contexts anywhere
 * else in the app.
 */
export async function runOperation<I extends z.ZodType, O extends z.ZodType>({
  operation,
  input,
}: RunOperationInput<I, O>): Promise<Result<z.infer<O>>> {
  // The request first: at build time it makes Next render the page per request instead of
  // prerendering it, before `ensureOperations` reads env that only exists at runtime.
  const logContext = await webLogContext();
  ensureOperations();
  return runWithLogContext({
    context: logContext,
    fn: async () => {
      const context: Result<ExecuteContext> = await resolveExecuteContext({
        headers: await headers(),
      });
      if (!context.ok) return context;
      return execute({ operation, input, context: context.value, afterCommit });
    },
  });
}
