import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toOccupancyDto } from "../occupancy/to-occupancy-dto";
import { leaveQueue } from "./leave-queue";
import { lockOptionQueue, nextRank } from "./option-queue";
import { checkNewOption } from "./option-rules";
import {
  OPTION_SOURCE,
  OptionCreateInputSchema,
  OptionIdInputSchema,
  OptionSchema,
} from "./schema";
import { loadOption, toOptionDto } from "./to-option-dto";

export const createOption = defineOperation({
  name: "option.create",
  kind: "command",
  description:
    "Place an option (a preliminary hold) on a bookable item for a period until an expiry date " +
    "(ADR 0022). Options queue per item and time: the rank is set automatically to the number of " +
    "active overlapping options + 1 (1 = first option). Optionally tied to a ticket.",
  input: OptionCreateInputSchema,
  output: OptionSchema,
  permission: "option:write",
  handler: async ({ input, context }) => {
    const valid = await checkNewOption({ context, input });
    if (!valid.ok) return valid;
    await lockOptionQueue({ context, itemId: input.itemId });
    const rank = await nextRank({ context, ...input });
    const row = await context.db.option.create({
      data: { ...input, rank, organizationId: context.organizationId },
    });
    const option = toOptionDto({ row });
    context.recordChange({ entityId: row.id, after: option });
    const { itemId, startsAt, endsAt } = row;
    const occupancy = await context.db.occupancy.create({
      data: {
        organizationId: context.organizationId,
        ...{ itemId, startsAt, endsAt, type: "OPTION" },
        ...{ sourceType: OPTION_SOURCE, sourceId: row.id },
      },
    });
    const after = toOccupancyDto({ row: occupancy });
    context.recordChange({ entityType: "occupancy", entityId: occupancy.id, after });
    return ok({ value: option });
  },
});

export const releaseOption = defineOperation({
  name: "option.release",
  kind: "command",
  description:
    "Release an ACTIVE option (the customer no longer wants the hold). Its occupancy is released " +
    "and the options queued behind it move up. A converted, expired or released option is a " +
    "CONFLICT.",
  input: OptionIdInputSchema,
  output: OptionSchema,
  permission: "option:write",
  handler: async ({ input, context }) => {
    const before = await loadOption({ context, id: input.id });
    if (!before) return notFound({ entity: "Option" });
    return leaveQueue({ context, before, to: "RELEASED" });
  },
});
