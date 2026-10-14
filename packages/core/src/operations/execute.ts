import { elapsedMs } from "@okazi/logger";
import type { z } from "zod";
import { fromUnknown } from "../errors/from-unknown";
import { err, type Result } from "../errors/result";
import { authorize } from "./authorize";
import type { ExecuteContext } from "./context";
import { logOperation } from "./log-operation";
import { parseWith } from "./parse-with";
import { runAfterCommit } from "./run-after-commit";
import { runCommand } from "./run-command";
import { runQuery } from "./run-query";
import type { Operation } from "./types";

export type AfterCommitInput = { operation: Operation; output: unknown; context: ExecuteContext };

/** Runs after a command committed (e.g. search indexing). Failures never undo the command. */
export type AfterCommitHook = (args: AfterCommitInput) => Promise<void>;

export type ExecuteInput<I extends z.ZodType, O extends z.ZodType> = {
  operation: Operation<I, O>;
  input: unknown;
  context: ExecuteContext;
  afterCommit?: readonly AfterCommitHook[];
};

type AttemptInput = Omit<ExecuteInput<z.ZodType, z.ZodType>, "operation"> & {
  operation: Operation;
};

async function attempt({
  operation,
  input,
  context,
  afterCommit = [],
}: AttemptInput): Promise<Result<unknown>> {
  const parsed = parseWith({ schema: operation.input, data: input, side: "input" });
  if (!parsed.ok) return parsed;
  const allowed = authorize({ operation, context });
  if (!allowed.ok) return allowed;
  try {
    const run = operation.kind === "command" ? runCommand : runQuery;
    const result = await run({ operation, input: parsed.value, context });
    if (result.ok && operation.kind === "command") {
      await runAfterCommit({ hooks: afterCommit, operation, output: result.value, context });
    }
    return result;
  } catch (error) {
    return err({ error: fromUnknown({ error }) });
  }
}

/**
 * The only way to run an operation: validate → authorize → handle → validate → audit, and
 * exactly one system-log line per call whatever the outcome (ADR 0014).
 */
export async function execute<I extends z.ZodType, O extends z.ZodType>({
  operation,
  ...rest
}: ExecuteInput<I, O>): Promise<Result<z.infer<O>>> {
  const op: Operation = operation;
  const since = performance.now();
  const result = await attempt({ operation: op, ...rest });
  logOperation({ operation: op, context: rest.context, result, durationMs: elapsedMs({ since }) });
  return result as Result<z.infer<O>>;
}
