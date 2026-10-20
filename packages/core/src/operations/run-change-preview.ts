import { diffRecord } from "../change-preview/diff-record";
import { idsIn, resolveNames } from "../change-preview/resolve-names";
import type { ChangePreview, RecordChangePreview } from "../change-preview/schema";
import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import { FEATURE_SPECS, parseFeature } from "../permissions/features";
import { authorize } from "./authorize";
import type { ExecuteContext } from "./context";
import { parseWith } from "./parse-with";
import type { AnyOperation, RecordedChange } from "./types";

export type PreviewChangeInput = {
  operation: AnyOperation;
  input: unknown;
  context: ExecuteContext;
};

/** Thrown to roll the preview back while carrying what the handler recorded. */
class PreviewDone extends Error {
  readonly result: Result<unknown>;
  readonly changes: RecordedChange[];

  constructor({ result, changes }: { result: Result<unknown>; changes: RecordedChange[] }) {
    super("change preview");
    this.name = "PreviewDone";
    this.result = result;
    this.changes = changes;
  }
}

const nameOf = ({ value }: { value: unknown }): string | null => {
  const name = (value as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name : null;
};

function toPreview({ operation, change }: { operation: AnyOperation; change: RecordedChange }) {
  const status = ({ value }: { value: unknown }) => (value as { status?: unknown } | null)?.status;
  const archived =
    status({ value: change.after }) === "ARCHIVED" &&
    status({ value: change.before }) !== "ARCHIVED";
  return {
    entityType: change.entityType ?? operation.entityType,
    entityId: change.entityId,
    kind: change.before === undefined ? "create" : archived ? "archive" : "update",
    name: nameOf({ value: change.after }) ?? nameOf({ value: change.before }),
    // A new record's empty fields say nothing; only what it is created with is shown.
    fields: diffRecord({ before: change.before, after: change.after }).filter(
      (field) => change.before !== undefined || (field.after !== null && field.after !== ""),
    ),
  } satisfies RecordChangePreview;
}

/** Runs the command's handler in a transaction that is always rolled back, keeping its changes. */
async function dryChanges({ operation, input, context }: PreviewChangeInput) {
  try {
    await context.db.$transaction(async (tx) => {
      const changes: RecordedChange[] = [];
      const recordChange = ({ operation, entityType, entityId, before, after }: RecordedChange) =>
        void changes.push({ operation, entityType, entityId, before, after });
      const result = await operation.handler({
        input,
        context: { ...context, db: tx, recordChange },
      });
      throw new PreviewDone({ result, changes });
    });
  } catch (error) {
    if (!(error instanceof PreviewDone)) throw error;
    return error.result.ok ? ok({ value: error.changes }) : error.result;
  }
  return err({
    error: new AppError({ code: "INTERNAL", message: "Change preview did not roll back" }),
  });
}

/**
 * What a command would change (ADR 0049), without changing anything: the same input check and
 * permission as `execute`, the handler in a rolled-back transaction, a field diff per record, the
 * names of the ids involved and the operation's consequences. A failing command fails here too.
 */
export async function previewChange({
  operation,
  input,
  context,
}: PreviewChangeInput): Promise<Result<ChangePreview>> {
  const parsed = parseWith({ schema: operation.input, data: input, side: "input" });
  if (!parsed.ok) return parsed;
  const allowed = authorize({ operation, context });
  if (!allowed.ok) return allowed;
  const read = { ...context, recordChange: () => undefined };
  const consequences =
    (await operation.consequences?.({ input: parsed.value, context: read })) ?? [];
  const recorded = await dryChanges({ operation, input: parsed.value, context });
  if (!recorded.ok) return recorded;
  const changes = recorded.value.map((change) => toPreview({ operation, change }));
  const names = await resolveNames({ context, ids: idsIn({ texts: changes }) });
  const feature = parseFeature({ feature: operation.permission.split(":")[0] ?? "" });
  const group = feature ? FEATURE_SPECS[feature].group : "self";
  return ok({ value: { group, changes, names, consequences } });
}
