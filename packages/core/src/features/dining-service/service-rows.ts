import type { DiningService } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { type DiningServiceDto, TurnTimeSchema } from "./schema";

/** A stored sitting as its DTO; turn times are parsed, and an unreadable value is dropped. */
export function toServiceDto({ row }: { row: DiningService }): DiningServiceDto {
  const turns = TurnTimeSchema.array().safeParse(row.turnTimes);
  return {
    id: row.id,
    roomItemId: row.roomItemId,
    name: row.name,
    layoutId: row.layoutId,
    weekdays: row.weekdays,
    firstStartMinute: row.firstStartMinute,
    lastStartMinute: row.lastStartMinute,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    slotMinutes: row.slotMinutes,
    turnTimes: turns.success ? turns.data : [],
    maxCoversPerSlot: row.maxCoversPerSlot,
    minMinutesAhead: row.minMinutesAhead,
    maxDaysAhead: row.maxDaysAhead,
    changeCutoffMinutes: row.changeCutoffMinutes,
    maxOnlineParty: row.maxOnlineParty,
    depositFromParty: row.depositFromParty,
    depositPerCoverMinor: row.depositPerCoverMinor,
    status: row.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
  };
}

type FindInput = { context: Pick<OperationContext, "db">; id: string };

/** An active sitting, or null. */
export async function findService({ context, id }: FindInput) {
  const row = await context.db.diningService.findFirst({ where: { id } });
  return row ? toServiceDto({ row }) : null;
}
