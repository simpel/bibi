import type { Result } from "../errors/result";
import type { ExecuteContext } from "./context";
import { parseWith } from "./parse-with";
import type { AnyOperation } from "./types";

export type RunDryRunInput = { operation: AnyOperation; input: unknown; context: ExecuteContext };

/** Thrown to roll the transaction back while carrying the handler's result out. */
class DryRunDone extends Error {
  readonly result: Result<unknown>;

  constructor({ result }: { result: Result<unknown> }) {
    super("dry run");
    this.name = "DryRunDone";
    this.result = result;
  }
}

/** Runs the handler in a transaction that never commits (`dryRun` operations). */
export async function runDryRun({
  operation,
  input,
  context,
}: RunDryRunInput): Promise<Result<unknown>> {
  try {
    await context.db.$transaction(async (tx) => {
      const result = await operation.handler({
        input,
        context: { ...context, db: tx, recordChange: () => undefined },
      });
      throw new DryRunDone({ result });
    });
  } catch (error) {
    if (!(error instanceof DryRunDone)) throw error;
    if (!error.result.ok) return error.result;
    return parseWith({ schema: operation.output, data: error.result.value, side: "output" });
  }
  throw new Error("Dry run did not roll back");
}
