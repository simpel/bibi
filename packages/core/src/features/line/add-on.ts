import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import type { InsertLineInput } from "./insert-line";
import type { LineCreateOperationInput, LineRecord } from "./schema";
import { loadLine } from "./to-line-record";

type Context = Pick<OperationContext, "db">;

const atParent = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "parentLineId", message }] });

/** ADR 0088 decision 4: the parent is a top-level line of the same order, one level only. */
function checkParent({ parent, orderId }: { parent: LineRecord; orderId: string }) {
  if (parent.orderId !== orderId) {
    return atParent({ message: "The parent line belongs to another order" });
  }
  if (parent.role !== null) {
    return atParent({
      message: "An add-on goes under a top-level line, not under a part, option or add-on line",
    });
  }
  return ok({ value: true });
}

type Period = Pick<LineCreateOperationInput, "startsAt" | "endsAt">;

/** Decision 8: no time given = the parent's period (copied, owned after); else the add-on's own. */
const periodOf = ({ input, parent }: { input: Period; parent: LineRecord }) =>
  input.startsAt === undefined && input.endsAt === undefined
    ? { startsAt: parent.startsAt, endsAt: parent.endsAt }
    : { startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null };

export type CreateInsertInput = { context: Context; input: LineCreateOperationInput };

/**
 * `line.create`'s input as `insertLine` takes it. Without `parentLineId` an ordinary line, which
 * needs its type. With it an add-on (ADR 0088): the parent must be a top-level line of the same
 * order (another organization's line is NOT_FOUND); type and period default to the parent's.
 */
export async function createInsertInput({
  context,
  input,
}: CreateInsertInput): Promise<Result<InsertLineInput["input"]>> {
  const { parentLineId, entityTypeId, ...rest } = input;
  if (!parentLineId) {
    if (entityTypeId) return ok({ value: { ...rest, entityTypeId } });
    const message = "Choose the line type";
    return invalid({ message, issues: [{ path: "entityTypeId", message }] });
  }
  const parent = await loadLine({ context, id: parentLineId });
  if (!parent) return notFound({ entity: "Line" });
  const checked = checkParent({ parent, orderId: input.orderId });
  if (!checked.ok) return checked;
  return ok({
    value: {
      ...rest,
      ...periodOf({ input, parent }),
      entityTypeId: entityTypeId ?? parent.entityTypeId,
      parentLineId,
      role: "ADD_ON",
    },
  });
}
