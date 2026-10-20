import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkLinePeriod, checkPlace, checkTicket } from "./line-rules";
import { initialStateOf } from "./line-state";
import type { LineCreateInput, LineRecord } from "./schema";
import { recordFirstState } from "./state-history";
import { LINE_INCLUDE, loadLine, toLineRecord } from "./to-line-record";

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
    ...checked.value,
    insert: ({ id }) =>
      context.db.line.create({
        data: {
          ...{ id, ...data, ...period },
          entityTypeId,
          stateId,
          fields: toJson({ value: checked.value.fields }) ?? {},
          organizationId: context.organizationId,
        },
        include: LINE_INCLUDE,
      }),
  });
  // First state history row (ADR 0054); holds follow by trigger, an overlap is CONFLICT (0053).
  await recordFirstState({ context, lineId: row.id, stateId });
  const line = (await loadLine({ context, id: row.id })) ?? toLineRecord({ row });
  context.recordChange({ entityId: row.id, after: line });
  return ok({ value: line });
}
