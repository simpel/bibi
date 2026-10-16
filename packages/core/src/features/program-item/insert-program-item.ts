import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkMembers } from "../../shared/check-members";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkPeriod } from "../occupancy/occupancy-rules";
import { checkBooking, checkPlace } from "./program-item-rules";
import { reserveProgramItem } from "./reserve";
import type { ProgramItemCreateInput, ProgramItemDto } from "./schema";
import { toProgramItemDto } from "./to-program-item-dto";

export type InsertProgramItemInput = {
  context: OperationContext;
  input: ProgramItemCreateInput;
};

/**
 * Creates a program item, occupies its bookable item and records the change. Shared by
 * `programItem.create` and `booking.createQuick`.
 */
export async function insertProgramItem({
  context,
  input: { entityTypeId, fields, ...data },
}: InsertProgramItemInput): Promise<Result<ProgramItemDto>> {
  const itemId = data.itemId ?? null;
  const setupId = data.setupId ?? null;
  for (const check of [
    await loadTypeOfBase({ context, entityTypeId, base: "PROGRAM_ITEM" }),
    await checkBooking({ context, bookingId: data.bookingId }),
    checkPeriod(data),
    await checkPlace({ context, itemId, setupId }),
    await checkMembers({ context, userIds: { responsibleId: data.responsibleId } }),
  ]) {
    if (!check.ok) return check;
  }
  const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
  if (!checked.ok) return checked;
  const row = await context.db.programItem.create({
    data: {
      ...data,
      entityTypeId,
      fields: toJson({ value: checked.value }) ?? {},
      organizationId: context.organizationId,
    },
  });
  const programItem = toProgramItemDto({ row });
  context.recordChange({ entityId: row.id, after: programItem });
  const reserved = await reserveProgramItem({ context, programItem });
  return reserved.ok ? ok({ value: programItem }) : reserved;
}
