import { PLATFORM_SCOPE } from "@bibi/db";
import { ok, type Result } from "../errors/result";
import { auditRows } from "../operations/audit-rows";
import { parseWith } from "../operations/parse-with";
import { Rollback } from "../operations/rollback";
import type { RecordedChange } from "../operations/types";
import type { AnyPlatformOperation, PlatformContext } from "./types";

export type RunPlatformInput = {
  operation: AnyPlatformOperation;
  input: unknown;
  context: PlatformContext;
};

export async function runPlatformQuery({
  operation,
  input,
  context,
}: RunPlatformInput): Promise<Result<unknown>> {
  const { actor, db } = context;
  const result = await operation.handler({
    input,
    context: { actor, db, recordChange: () => undefined },
  });
  if (!result.ok) return result;
  return parseWith({ schema: operation.output, data: result.value, side: "output" });
}

/** Handler, output validation and audit rows (`PLATFORM_SCOPE`) commit or roll back together. */
export async function runPlatformCommand({
  operation,
  input,
  context,
}: RunPlatformInput): Promise<Result<unknown>> {
  const { actor } = context;
  try {
    const value = await context.db.$transaction(async (tx) => {
      const changes: RecordedChange[] = [];
      const recordChange = ({ entityType, entityId, before, after }: RecordedChange) =>
        void changes.push({ entityType, entityId, before, after });
      const result = await operation.handler({ input, context: { actor, db: tx, recordChange } });
      const parsed = result.ok
        ? parseWith({ schema: operation.output, data: result.value, side: "output" })
        : result;
      if (!parsed.ok) throw new Rollback({ result: parsed });
      const output = parsed.value;
      const data = auditRows({ organizationId: PLATFORM_SCOPE, operation, actor, changes, output });
      await tx.auditLog.createMany({ data });
      return output;
    });
    return ok({ value });
  } catch (error) {
    if (error instanceof Rollback) return error.result;
    throw error;
  }
}
