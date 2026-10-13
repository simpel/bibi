import type { z } from "zod";
import { fromUnknown } from "../errors/from-unknown";
import { err, type Result } from "../errors/result";
import { authorize } from "./authorize";
import type { ExecuteContext } from "./context";
import { parseWith } from "./parse-with";
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

/** The only way to run an operation: validate → authorize → handle → validate → audit. */
export async function execute<I extends z.ZodType, O extends z.ZodType>({
  operation,
  input,
  context,
  afterCommit = [],
}: ExecuteInput<I, O>): Promise<Result<z.infer<O>>> {
  const op: Operation = operation;
  const parsed = parseWith({ schema: op.input, data: input, side: "input" });
  if (!parsed.ok) return parsed;
  const allowed = authorize({ operation: op, context });
  if (!allowed.ok) return allowed;
  try {
    const run = op.kind === "command" ? runCommand : runQuery;
    const result = await run({ operation: op, input: parsed.value, context });
    if (result.ok && op.kind === "command") {
      await Promise.allSettled(
        afterCommit.map((hook) => hook({ operation: op, output: result.value, context })),
      );
    }
    return result as Result<z.infer<O>>;
  } catch (error) {
    return err({ error: fromUnknown({ error }) });
  }
}
