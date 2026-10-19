import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkPeriod } from "../occupancy/occupancy-rules";
import { checkPlace, checkTicket } from "./line-rules";
import { initialStateOf } from "./line-state";
import { reserveLine } from "./reserve";
import type { LineCreateInput, LineDto } from "./schema";
import { toLineDto } from "./to-line-dto";

export type InsertLineInput = {
  context: OperationContext;
  input: LineCreateInput;
};

/**
 * Creates a line in the state the phase grid gives it for the ticket's phase (else its
 * type's initial state), holds its bookable item as the state says and records the change.
 * Shared by `line.create`.
 */
export async function insertLine({
  context,
  input: { entityTypeId, fields, ...data },
}: InsertLineInput): Promise<Result<LineDto>> {
  const itemId = data.itemId ?? null;
  const setupId = data.setupId ?? null;
  for (const check of [
    await loadTypeOfBase({ context, entityTypeId, base: "LINE" }),
    await checkTicket({ context, ticketId: data.ticketId }),
    checkPeriod(data),
    await checkPlace({ context, ticketId: data.ticketId, itemId, setupId }),
  ]) {
    if (!check.ok) return check;
  }
  const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
  if (!checked.ok) return checked;
  const row = await context.db.line.create({
    data: {
      ...data,
      entityTypeId,
      stateId: await initialStateOf({ context, ticketId: data.ticketId, itemId }),
      fields: toJson({ value: checked.value }) ?? {},
      organizationId: context.organizationId,
    },
  });
  const line = toLineDto({ row });
  context.recordChange({ entityId: row.id, after: line });
  const reserved = await reserveLine({ context, line });
  return reserved.ok ? ok({ value: line }) : reserved;
}
