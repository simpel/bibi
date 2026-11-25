import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { resolveHorizon } from "../dashboard/horizon";
import { cardCues } from "./card-cues";
import { lineCounts } from "./load-cards";
import { nextTasks } from "./next-tasks";
import type { PipelineCuesInput } from "./schema";

/**
 * `pipeline.cues`: the board's card cues for any orders, e.g. a page of the order table (spec:
 * boards): preliminary, only followed, and the flags. Line states need `program:read`.
 */
export async function pipelineCuesHandler({ input, context }: HandlerInput<PipelineCuesInput>) {
  const found = await context.db.order.findMany({
    where: { id: { in: input.orderIds } },
    select: { id: true },
  });
  const ids = found.map((order) => order.id);
  const counted = canView({ context, feature: "program" });
  const [horizon, lines] = await Promise.all([
    resolveHorizon({ context }),
    counted ? lineCounts({ context, ids }) : null,
  ]);
  const [cues, tasks] = await Promise.all([
    cardCues({ context, orderIds: ids, horizon }),
    nextTasks({ context, orderIds: ids }),
  ]);
  return ok({
    value: {
      cues: ids.map((orderId) => {
        const held = lines?.get(orderId);
        return {
          orderId,
          soft: lines ? (held?.heldLines ?? 0) > 0 && (held?.bookedLines ?? 0) === 0 : null,
          following: cues.following.has(orderId),
          flags: cues.flags.get(orderId) ?? [],
          nextTask: tasks.get(orderId) ?? null,
        };
      }),
    },
  });
}
