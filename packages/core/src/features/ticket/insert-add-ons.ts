import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createInsertInput } from "../line/add-on";
import { insertLine } from "../line/insert-line";
import type { LineRecord } from "../line/schema";
import { atPath } from "./at-path";
import type { CreateDraftLine } from "./draft-line-schema";

export type InsertAddOnsInput = {
  /** Maps the holds trigger's overlap to CONFLICT naming the add-on. */
  guard: <T>(input: { name: string; run: () => Promise<Result<T>> }) => Promise<Result<T>>;
  /** Audits as `line`. */
  context: OperationContext;
  line: CreateDraftLine;
  made: LineRecord;
  index: number;
  /** Item id → name, for an add-on without a name of its own. */
  itemNames: ReadonlyMap<string, string>;
};

/**
 * The draft line's add-ons under the new line (ADR 0088 decision 11), each as `line.create` with
 * `parentLineId` makes it: the parent's type and period unless given. Errors at
 * `lines.<index>.addOns.<j>`.
 */
export async function insertAddOns({
  guard,
  context,
  line,
  made,
  index,
  itemNames,
}: InsertAddOnsInput): Promise<Result<true>> {
  for (const [at, addOn] of (line.addOns ?? []).entries()) {
    const path = `lines.${index}.addOns.${at}`;
    const name = addOn.name ?? (addOn.itemId ? itemNames.get(addOn.itemId) : undefined) ?? "";
    const input = { ...addOn, name, ticketId: made.ticketId, parentLineId: made.id };
    const prepared = await createInsertInput({ context, input });
    if (!prepared.ok) return atPath({ result: prepared, path });
    const added = await guard({ name, run: () => insertLine({ context, input: prepared.value }) });
    if (!added.ok) return atPath({ result: added, path });
  }
  return ok({ value: true });
}
