import { ok, type Result } from "../errors/result";
import type { ExecuteContext } from "./context";
import { parseWith } from "./parse-with";
import type { AnyOperation, RecordedChange } from "./types";
import { writeAudit } from "./write-audit";

export type RunExternalInput = {
  operation: AnyOperation;
  input: unknown;
  output: unknown;
  context: ExecuteContext;
};

/**
 * The operation's `external` step after its commit (ADR 0058). Its writes are audited like the
 * handler's, also when it fails (the record it left in a failure state). Only `execute` calls it.
 */
export async function runExternal({
  operation,
  input,
  output,
  context,
}: RunExternalInput): Promise<Result<unknown>> {
  if (!operation.external) return ok({ value: output });
  const changes: RecordedChange[] = [];
  const recordChange = ({ entityType, entityId, before, after }: RecordedChange) =>
    void changes.push({ entityType, entityId, before, after });
  const result = await operation.external({ input, output, context: { ...context, recordChange } });
  if (changes.length > 0) {
    const audited = result.ok ? result.value : output;
    await writeAudit({ db: context.db, operation, actor: context.actor, changes, output: audited });
  }
  if (!result.ok) return result;
  return parseWith({ schema: operation.output, data: result.value, side: "output" });
}
