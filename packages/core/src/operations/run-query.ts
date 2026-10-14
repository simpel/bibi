import type { Result } from "../errors/result";
import type { ExecuteContext } from "./context";
import { parseWith } from "./parse-with";
import type { AnyOperation } from "./types";

export type RunQueryInput = { operation: AnyOperation; input: unknown; context: ExecuteContext };

export async function runQuery({
  operation,
  input,
  context,
}: RunQueryInput): Promise<Result<unknown>> {
  const result = await operation.handler({
    input,
    context: { ...context, recordChange: () => undefined },
  });
  if (!result.ok) return result;
  return parseWith({ schema: operation.output, data: result.value, side: "output" });
}
