import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkLinePeriod, checkPlace, checkTicket } from "./line-rules";
import { initialStateOf } from "./line-state";
import { reserveLine } from "./reserve";
import type { LineCreateInput, LineRecord } from "./schema";
import { toLineRecord } from "./to-line-record";

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
}: InsertLineInput): Promise<Result<LineRecord>> {
  const itemId = data.itemId ?? null;
  const period = { startsAt: data.startsAt ?? null, endsAt: data.endsAt ?? null };
  for (const check of [
    await loadTypeOfBase({ context, entityTypeId, base: "LINE" }),
    await checkTicket({ context, ticketId: data.ticketId }),
    checkLinePeriod(period),
    await checkPlace({ context, ticketId: data.ticketId, itemId, setupId: data.setupId ?? null }),
  ]) {
    if (!check.ok) return check;
  }
  const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
  if (!checked.ok) return checked;
  const stateId = await initialStateOf({ context, ticketId: data.ticketId, itemId });
  const row = await createRecord({
    context,
    base: "LINE",
    entityTypeId,
    fields: checked.value,
    insert: ({ id }) =>
      context.db.line.create({
        data: {
          id,
          ...data,
          ...period,
          entityTypeId,
          stateId,
          fields: toJson({ value: checked.value }) ?? {},
          organizationId: context.organizationId,
        },
      }),
  });
  const line = toLineRecord({ row });
  context.recordChange({ entityId: row.id, after: line });
  const reserved = await reserveLine({ context, line });
  return reserved.ok ? ok({ value: line }) : reserved;
}
