import { ok, type Result } from "../errors/result";
import type { ExecuteContext } from "./context";
import { parseWith } from "./parse-with";
import { Rollback } from "./rollback";
import type { AnyOperation, RecordedChange } from "./types";
import { writeAudit } from "./write-audit";

export type RunCommandInput = { operation: AnyOperation; input: unknown; context: ExecuteContext };

/** Handler, output validation and audit rows commit or roll back together. */
export async function runCommand({
  operation,
  input,
  context,
}: RunCommandInput): Promise<Result<unknown>> {
  try {
    const value = await context.db.$transaction(async (tx) => {
      const changes: RecordedChange[] = [];
      const recordChange = ({ entityType, entityId, before, after }: RecordedChange) => {
        changes.push({ entityType, entityId, before, after });
      };
      const result = await operation.handler({
        input,
        context: { ...context, db: tx, recordChange },
      });
      const parsed = result.ok
        ? parseWith({ schema: operation.output, data: result.value, side: "output" })
        : result;
      if (!parsed.ok) throw new Rollback({ result: parsed });
      await writeAudit({ db: tx, operation, actor: context.actor, changes, output: parsed.value });
      return parsed.value;
    });
    return ok({ value });
  } catch (error) {
    if (error instanceof Rollback) return error.result;
    throw error;
  }
}
