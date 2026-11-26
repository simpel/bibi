import type { z } from "zod";
import { ok } from "../errors/result";
import { defineOperation } from "../operations/define-operation";
import type { Permission } from "../operations/permission";
import { runNested } from "../operations/run-nested";
import type { Operation } from "../operations/types";
import type { Embeddable } from "../search/embeddable";
import { deleteArchived } from "./delete-archived";
import type { LifecycleKind } from "./lifecycle-kind";
import { restoreArchived } from "./restore-archived";
import { DeletedRecordSchema } from "./schema";

type IdInput = z.ZodObject<{ id: z.ZodString }>;

export type DefineRestoreInput<O extends z.ZodType> = {
  name: string;
  description: string;
  /** The same as the kind's archive operation. */
  permission: Permission;
  kind: LifecycleKind;
  input: IdInput;
  /** The kind's `get`: what the restored record looks like. */
  get: Operation<IdInput, O>;
  embeddable?: Embeddable;
};

/** `<entity>.restore` (ADR 0118): ARCHIVED → ACTIVE, audited with the archived row as before. */
export function defineRestoreOperation<O extends z.ZodType>({
  kind,
  get,
  ...definition
}: DefineRestoreInput<O>) {
  return defineOperation({
    ...definition,
    kind: "command",
    output: get.output,
    entityType: kind.entityType,
    handler: async ({ input, context }) => {
      const restored = await restoreArchived({ kind, context, id: input.id });
      if (!restored.ok) return restored;
      const after = await runNested({ operation: get, input, context });
      if (!after.ok) return after;
      context.recordChange({ entityId: input.id, before: restored.value, after: after.value });
      // The record as `get` returns it, already parsed by its output schema.
      return ok({ value: after.value as z.input<O> });
    },
  });
}

export type DefineDeleteInput = Omit<DefineRestoreInput<z.ZodType>, "get" | "embeddable">;

/**
 * `<entity>.delete` (ADR 0118): deletes an archived record for good, audited with its last state
 * as the before image. Returns its id.
 */
export function defineDeleteOperation({ kind, ...definition }: DefineDeleteInput) {
  return defineOperation({
    ...definition,
    kind: "command",
    output: DeletedRecordSchema,
    entityType: kind.entityType,
    handler: async ({ input, context }) => {
      const deleted = await deleteArchived({ kind, context, id: input.id });
      if (!deleted.ok) return deleted;
      context.recordChange({ entityId: input.id, before: deleted.value });
      return ok({ value: { id: input.id } });
    },
  });
}
