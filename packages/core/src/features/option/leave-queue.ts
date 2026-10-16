import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { releaseOccupancyBySource } from "../occupancy/release-by-source";
import { lockOptionQueue, rerankQueue } from "./option-queue";
import { OPTION_SOURCE, type OptionDto, type OptionStatus } from "./schema";
import { loadOption, toOptionDto } from "./to-option-dto";
import { checkOptionTransition } from "./transitions";

export type LeaveQueueInput = {
  context: Pick<OperationContext, "db" | "recordChange">;
  before: OptionDto;
  to: Exclude<OptionStatus, "ACTIVE">;
};

/**
 * The one place an option leaves the queue: checks the state machine (`CONFLICT` otherwise),
 * stamps `statusChangedAt`, releases its `OPTION` occupancy and moves the options behind it up.
 */
export async function leaveQueue({
  context,
  before,
  to,
}: LeaveQueueInput): Promise<Result<OptionDto>> {
  await lockOptionQueue({ context, itemId: before.itemId });
  // Re-read under the lock: a concurrent command may have moved the option meanwhile.
  const current = await loadOption({ context, id: before.id });
  if (!current) return notFound({ entity: "Option" });
  const allowed = checkOptionTransition({ from: current.optionStatus, to });
  if (!allowed.ok) return allowed;
  const row = await context.db.option.update({
    where: { id: before.id },
    data: { optionStatus: to, rank: null, statusChangedAt: new Date() },
  });
  const option = toOptionDto({ row });
  context.recordChange({ entityType: "option", entityId: row.id, before: current, after: option });
  const released = await releaseOccupancyBySource({
    context,
    sourceType: OPTION_SOURCE,
    sourceId: row.id,
  });
  if (!released.ok) return released;
  await rerankQueue({ context, itemId: row.itemId, startsAt: row.startsAt, endsAt: row.endsAt });
  return ok({ value: option });
}
