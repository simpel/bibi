import { fromUnknown } from "../../errors/from-unknown";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { chooseOptions } from "../line/choose-options";
import { insertLine } from "../line/insert-line";
import type { LineRecord } from "../line/schema";
import { insertRequirement } from "../requirement/insert-requirement";
import { atPath } from "./at-path";
import type { CreateDraftLine } from "./draft-line-schema";
import { insertAddOns } from "./insert-add-ons";

type Context = OperationContext;

/** The context whose recorded changes are audited as `entityType` (`line`, `requirement`). */
const auditedAs = ({ context, entityType }: { context: Context; entityType: string }) => ({
  ...context,
  recordChange: (change: Parameters<Context["recordChange"]>[0]) =>
    context.recordChange({ ...change, entityType: change.entityType ?? entityType }),
});

type GuardInput<T> = { name: string; run: () => Promise<Result<T>> };

/**
 * Runs an insert and turns the line holds trigger's overlap (`line_occupancy_conflict`, ADR
 * 0053), the last guard after the up-front check, into `CONFLICT` naming the draft line (the caller
 * puts it at the line's path). The transaction is aborted by then; the caller returns the error,
 * so everything rolls back.
 */
async function guarded<T>({ name, run }: GuardInput<T>): Promise<Result<T>> {
  try {
    return await run();
  } catch (error) {
    const mapped = fromUnknown({ error });
    const occupancy = mapped.issues.some((issue) => issue.path.startsWith("lines."));
    if (mapped.code !== "CONFLICT" || !occupancy) throw error;
    return conflict({ message: `"${name}": ${mapped.message}` });
  }
}

export type InsertDraftLineInput = {
  context: Context;
  orderId: string;
  line: CreateDraftLine;
  index: number;
  /** Item id → name, for an add-on without a name of its own (ADR 0088). */
  itemNames: ReadonlyMap<string, string>;
};

/** The draft's chosen options (ADR 0082) and needs on the new line, errors at their paths. */
async function addChoicesAndNeeds({
  context,
  line,
  index,
  made,
}: InsertDraftLineInput & {
  made: LineRecord;
}): Promise<Result<true>> {
  const path = `lines.${index}`;
  if (line.options && line.options.length > 0) {
    const input = { lineId: made.id, options: line.options };
    const chosen = await guarded({
      name: line.name,
      run: () => chooseOptions({ context: auditedAs({ context, entityType: "line" }), input }),
    });
    if (!chosen.ok) return atPath({ result: chosen, path });
  }
  const needs = auditedAs({ context, entityType: "requirement" });
  for (const [at, need] of (line.requirements ?? []).entries()) {
    const input = { ...need, orderId: made.orderId, lineId: made.id };
    const added = await insertRequirement({ context: needs, input });
    if (!added.ok) return atPath({ result: added, path: `${path}.requirements.${at}` });
  }
  return ok({ value: true });
}

/**
 * One draft line of `order.create` (ADR 0081 decision 9) on the new order: the line in its
 * start state, then its options, its needs and its add-ons (ADR 0088). Every error is at
 * `lines.<index>`.
 */
export async function insertDraftLine({
  context,
  orderId,
  line,
  index,
  itemNames,
}: InsertDraftLineInput): Promise<Result<LineRecord>> {
  const { options: _options, requirements: _requirements, addOns: _addOns, ...details } = line;
  const path = `lines.${index}`;
  const made = await guarded({
    name: line.name,
    run: () =>
      insertLine({
        context: auditedAs({ context, entityType: "line" }),
        input: { ...details, orderId },
      }),
  });
  if (!made.ok) return atPath({ result: made, path });
  const input = { context, orderId, line, index, itemNames, made: made.value };
  const extras = await addChoicesAndNeeds(input);
  if (!extras.ok) return extras;
  const lineContext = auditedAs({ context, entityType: "line" });
  const addOns = await insertAddOns({ ...input, context: lineContext, guard: guarded });
  return addOns.ok ? made : addOns;
}
