import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { checkReadable } from "../ticket/ticket-rules";
import type { StatusGridSetCellInput } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

const problem = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

type StatusInput = { context: Context; statusId: string };

/** An active, non-closing status the caller may read (closing statuses ignore the grid). */
async function checkStatus({ context, statusId }: StatusInput): Promise<Result<true>> {
  const path = "statusId";
  const readable = checkReadable({ context, permission: "pipeline:read", path });
  if (!readable.ok) return readable;
  const ticketStatus = await context.db.ticketStatus.findFirst({ where: { id: statusId } });
  if (!ticketStatus) return problem({ path, message: "Unknown or archived status" });
  if (ticketStatus.closes) {
    return problem({ path, message: `"${ticketStatus.name}" is closing: it releases every line` });
  }
  return ok({ value: true });
}

type StateInput = { context: Context; entityTypeId: string; stateId: string | null };

/** An active state of the item type the caller may read; null (clear) needs no state. */
async function checkState({ context, entityTypeId, stateId }: StateInput): Promise<Result<true>> {
  if (stateId === null) return ok({ value: true });
  const path = "stateId";
  const readable = checkReadable({ context, permission: "pipeline:read", path });
  if (!readable.ok) return readable;
  const found = await context.db.itemState.count({ where: { id: stateId, entityTypeId } });
  if (found > 0) return ok({ value: true });
  return problem({ path, message: "Unknown or archived state, or a state of another type" });
}

export type CheckCellInput = { context: Context; input: StatusGridSetCellInput };

/**
 * Every id a cell refers to (ADR 0044): an active non-closing status, an active item type (base
 * `ITEM`) and an active state of that type, each in the organization and readable by the caller.
 * Problems are `VALIDATION` on the field.
 */
export async function checkCell({ context, input }: CheckCellInput): Promise<Result<true>> {
  const { statusId, entityTypeId, stateId } = input;
  const ticketStatus = await checkStatus({ context, statusId });
  if (!ticketStatus.ok) return ticketStatus;
  const path = "entityTypeId";
  const readable = checkReadable({ context, permission: "configuration:read", path });
  if (!readable.ok) return readable;
  const type = await loadTypeOfBase({ context, entityTypeId, base: "ITEM" });
  if (!type.ok) return type;
  return checkState({ context, entityTypeId, stateId });
}
