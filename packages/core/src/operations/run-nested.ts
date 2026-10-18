import type { z } from "zod";
import type { Result } from "../errors/result";
import { authorize } from "./authorize";
import { parseWith } from "./parse-with";
import type { Operation, OperationContext } from "./types";

export type RunNestedInput<I extends z.ZodType, O extends z.ZodType> = {
  operation: Operation<I, O>;
  input: z.input<I>;
  /** The calling command's context: its transaction and its audit batch. */
  context: OperationContext;
};

/**
 * Runs a normal command inside another command's transaction (a batch such as
 * `pipelineSetup.activate`): the same input validation, permission check, handler rules and
 * output validation as `execute`, and its changes join the caller's audit rows with the nested
 * operation's entity type. A failure is returned, so the caller rolls the whole batch back.
 */
export async function runNested<I extends z.ZodType, O extends z.ZodType>({
  operation,
  input,
  context,
}: RunNestedInput<I, O>): Promise<Result<z.infer<O>>> {
  const op: Operation = operation;
  const parsed = parseWith({ schema: op.input, data: input, side: "input" });
  if (!parsed.ok) return parsed;
  const allowed = authorize({ operation: op, context });
  if (!allowed.ok) return allowed;
  const result = await op.handler({
    input: parsed.value,
    context: {
      ...context,
      recordChange: (change) =>
        context.recordChange({ ...change, entityType: change.entityType ?? op.entityType }),
    },
  });
  if (!result.ok) return result;
  return parseWith({ schema: operation.output, data: result.value, side: "output" });
}
