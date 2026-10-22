import {
  createIndexingHook,
  type EmbedFn,
  type ExecuteContext,
  execute,
  type Operation,
  type Result,
} from "@bibi/core";
import type { z } from "zod";

export type RunCoreInput<I extends z.ZodType, O extends z.ZodType> = {
  operation: Operation<I, O>;
  input: z.input<I>;
  context: ExecuteContext;
  embed: EmbedFn;
};

/**
 * The app's own bookkeeping *as the user* (conversation, USER messages, approval notes): the same
 * `execute` path the web uses (validation, permission, audit, search indexing).
 */
export function runCore<I extends z.ZodType, O extends z.ZodType>({
  operation,
  input,
  context,
  embed,
}: RunCoreInput<I, O>): Promise<Result<z.infer<O>>> {
  return execute({ operation, input, context, afterCommit: [createIndexingHook({ embed })] });
}
