import { isDeepStrictEqual } from "node:util";
import type { Ticket } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import type { WorkOrderDefinitionDto } from "../work-order-definition/schema";
import { diffContent } from "./diff-content";
import type { WorkOrderContent, WorkOrderMatch } from "./schema";
import {
  toWorkOrderDto,
  WORK_ORDER_INCLUDE,
  type WorkOrderWithRecipients,
} from "./to-work-order-dto";

type Db = { context: Pick<OperationContext, "db" | "organizationId"> };
type Of = { ticketId: string; workOrderDefinitionId: string };

/** The newest version of a ticket's work order, and the newest one that was sent. */
export async function findVersions({ context, ticketId, workOrderDefinitionId }: Db & Of) {
  const where = { ticketId, workOrderDefinitionId };
  const [latest, sent] = await Promise.all([
    context.db.workOrder.findFirst({
      where,
      orderBy: { version: "desc" },
      include: WORK_ORDER_INCLUDE,
    }),
    context.db.workOrder.findFirst({
      where: { ...where, sentAt: { not: null } },
      orderBy: { version: "desc" },
      include: WORK_ORDER_INCLUDE,
    }),
  ]);
  return { latest, sent };
}

export type SameAsLatestInput = {
  latest: WorkOrderWithRecipients;
  content: WorkOrderContent;
  matches: WorkOrderMatch[];
  definition: WorkOrderDefinitionDto;
};

/** An unchanged ticket, matches and responsibility gives no new version. */
export const sameAsLatest = ({ latest, content, matches, definition }: SameAsLatestInput) =>
  latest.responsibilityId === definition.responsibilityId &&
  isDeepStrictEqual(latest.content, toJson({ value: content })) &&
  isDeepStrictEqual(latest.matches, toJson({ value: matches }));

export type CreateVersionInput = Db & {
  ticket: Ticket;
  definition: WorkOrderDefinitionDto;
  content: WorkOrderContent;
  matches: WorkOrderMatch[];
  latest: WorkOrderWithRecipients | null;
  sent: WorkOrderWithRecipients | null;
};

/**
 * The next version, with the rows marked ★ that differ from the last sent version. The only writer
 * of the `current` projection: the new version takes it from the previous one.
 */
export async function createVersion({
  context,
  ticket,
  definition,
  content,
  matches,
  latest,
  sent,
}: CreateVersionInput) {
  const before = sent ? toWorkOrderDto({ row: sent }).content : null;
  await context.db.workOrder.updateMany({
    where: { ticketId: ticket.id, workOrderDefinitionId: definition.id, current: true },
    data: { current: false },
  });
  return context.db.workOrder.create({
    data: {
      organizationId: context.organizationId,
      ticketId: ticket.id,
      workOrderDefinitionId: definition.id,
      version: (latest?.version ?? 0) + 1,
      responsibilityId: definition.responsibilityId,
      content: toJson({ value: content }) ?? {},
      changes: toJson({ value: diffContent({ before, after: content }) }) ?? [],
      matches: toJson({ value: matches }) ?? [],
      blocked: matches.some((match) => match.blocking),
      baseVersion: sent?.version ?? null,
      current: true,
    },
    include: WORK_ORDER_INCLUDE,
  });
}
