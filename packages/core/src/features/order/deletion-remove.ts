import { EITHER_STATUS, type KindInput } from "../../archive/lifecycle-kind";
import { deleteRecordDependents, deleteRecordRows, hardDelete } from "../../archive/record-rows";

type IdsInput = KindInput & { lineIds: string[] };

const idList = ({ rows }: { rows: { id: string }[] }) => rows.map((row) => row.id);

/** Notifications about the order or its run sheets, then the run sheets (recipients cascade). */
async function removeRunSheets({ context, id }: KindInput) {
  const { db } = context;
  const runSheets = idList({
    rows: await db.runSheet.findMany({ where: { orderId: id }, select: { id: true } }),
  });
  await db.notification.deleteMany({
    where: { OR: [{ orderId: id }, { runSheetId: { in: runSheets } }] },
  });
  await db.runSheet.deleteMany({ where: { orderId: id } });
}

/** Comments with their mentions; inbox messages stay in the inbox, no longer attached. */
async function removeComments({ context, id }: KindInput) {
  const { db } = context;
  const where = { orderId: id, status: EITHER_STATUS };
  const comments = idList({ rows: await db.comment.findMany({ where, select: { id: true } }) });
  await db.commentMention.deleteMany({ where: { commentId: { in: comments } } });
  await db.comment.updateMany({ where, data: { parentCommentId: null } });
  await hardDelete({ context }).comment.deleteMany({ where: { orderId: id } });
  await db.inboundMessage.updateMany({ where, data: { orderId: null } });
}

/** Draft quotes (sent ones refuse the delete) and the working versions (their lines cascade). */
async function removeQuotesAndVersions({ context, id, lineIds }: IdsInput) {
  const { db } = context;
  const where = { orderId: id, status: EITHER_STATUS };
  const quotes = idList({ rows: await db.quote.findMany({ where, select: { id: true } }) });
  await db.orderLine.deleteMany({
    where: { OR: [{ quoteId: { in: quotes } }, { lineId: { in: lineIds } }] },
  });
  await db.quote.updateMany({ where, data: { previousId: null } });
  await hardDelete({ context }).quote.deleteMany({ where: { orderId: id } });
  await db.orderVersion.updateMany({ where, data: { restoredFromId: null } });
  await hardDelete({ context }).orderVersion.deleteMany({ where: { orderId: id } });
}

/** Requirements (records, ADR 0056). */
async function removeRequirements({ context, id }: KindInput) {
  const where = { orderId: id, status: EITHER_STATUS };
  const ids = idList({
    rows: await context.db.requirement.findMany({ where, select: { id: true } }),
  });
  await deleteRecordDependents({ context, ids });
  await hardDelete({ context }).requirement.deleteMany({ where: { id: { in: ids } } });
  await deleteRecordRows({ context, ids });
}

/**
 * Allocations, then the lines (records; their holds and state history cascade), then the
 * alternative groups. Sub-lines are cut from their parents first (role and price effect need a
 * parent, ADR 0088).
 */
async function removeLines({ context, id, lineIds }: IdsInput) {
  const { db } = context;
  const hard = hardDelete({ context });
  const lines = { lineId: { in: lineIds }, status: EITHER_STATUS };
  await db.lineAllocation.updateMany({ where: lines, data: { parentAllocationId: null } });
  await hard.lineAllocation.deleteMany({ where: { lineId: { in: lineIds } } });
  const where = { orderId: id, status: EITHER_STATUS };
  await db.alternativeGroup.updateMany({ where, data: { chosenLineId: null } });
  await db.line.updateMany({
    where: { ...where, parentLineId: { not: null } },
    data: { parentLineId: null, role: null, priceEffect: null },
  });
  await deleteRecordDependents({ context, ids: lineIds });
  await hard.line.deleteMany({ where: { orderId: id } });
  await deleteRecordRows({ context, ids: lineIds });
  await hard.alternativeGroup.deleteMany({ where: { orderId: id } });
}

/**
 * Everything an order without money has (ADR 0118): run sheets, notifications, comments, draft
 * quotes, versions, requirements, lines and groups, then the order. Its status and estimate
 * history, mail and dismissals go by cascade.
 */
export async function removeOrder({ context, id }: KindInput) {
  const where = { orderId: id, status: EITHER_STATUS };
  const lineIds = idList({ rows: await context.db.line.findMany({ where, select: { id: true } }) });
  await removeRunSheets({ context, id });
  await removeComments({ context, id });
  await removeQuotesAndVersions({ context, id, lineIds });
  await removeRequirements({ context, id });
  await removeLines({ context, id, lineIds });
  await hardDelete({ context }).order.delete({ where: { id } });
}
