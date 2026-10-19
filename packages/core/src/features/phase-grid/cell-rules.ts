import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { checkReadable } from "../ticket/ticket-rules";
import type { PhaseGridSetCellInput } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

const problem = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

type PhaseInput = { context: Context; phaseId: string };

/** An active, non-terminal phase the caller may read (terminal phases ignore the grid). */
async function checkPhase({ context, phaseId }: PhaseInput): Promise<Result<true>> {
  const path = "phaseId";
  const readable = checkReadable({ context, permission: "pipeline:view", path });
  if (!readable.ok) return readable;
  const phase = await context.db.ticketPhase.findFirst({ where: { id: phaseId } });
  if (!phase) return problem({ path, message: "Unknown or archived phase" });
  if (phase.terminal) {
    return problem({ path, message: `"${phase.name}" is terminal: it releases every line` });
  }
  return ok({ value: true });
}

type StateInput = { context: Context; entityTypeId: string; stateId: string | null };

/** An active state of the item type the caller may read; null (clear) needs no state. */
async function checkState({ context, entityTypeId, stateId }: StateInput): Promise<Result<true>> {
  if (stateId === null) return ok({ value: true });
  const path = "stateId";
  const readable = checkReadable({ context, permission: "pipeline:view", path });
  if (!readable.ok) return readable;
  const found = await context.db.itemState.count({ where: { id: stateId, entityTypeId } });
  if (found > 0) return ok({ value: true });
  return problem({ path, message: "Unknown or archived state, or a state of another type" });
}

export type CheckCellInput = { context: Context; input: PhaseGridSetCellInput };

/**
 * Every id a cell refers to (ADR 0044): an active non-terminal phase, an active item type (base
 * `ITEM`) and an active state of that type, each in the organization and readable by the caller.
 * Problems are `VALIDATION` on the field.
 */
export async function checkCell({ context, input }: CheckCellInput): Promise<Result<true>> {
  const { phaseId, entityTypeId, stateId } = input;
  const phase = await checkPhase({ context, phaseId });
  if (!phase.ok) return phase;
  const path = "entityTypeId";
  const readable = checkReadable({ context, permission: "configuration:view", path });
  if (!readable.ok) return readable;
  const type = await loadTypeOfBase({ context, entityTypeId, base: "ITEM" });
  if (!type.ok) return type;
  return checkState({ context, entityTypeId, stateId });
}
