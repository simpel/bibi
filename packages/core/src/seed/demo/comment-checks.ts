import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoCommentsInput = { context: ExecuteContext; org: DemoOrg };

/** ADR 0115: a seeded line comment reaches the current run sheet of its order, on the line's row. */
export async function checkDemoComments({ context, org }: CheckDemoCommentsInput) {
  const comment = await context.db.comment.findFirst({
    where: { lineId: { not: null } },
    select: { orderId: true, lineId: true, body: true },
  });
  if (!comment) return [];
  const sheets = await context.db.runSheet.findMany({
    where: { orderId: comment.orderId, current: true },
    select: { content: true },
  });
  const carried = sheets.some((sheet) =>
    JSON.stringify(sheet.content).includes(JSON.stringify(comment.body)),
  );
  return carried ? [] : [`${org.slug}: the comment on line ${comment.lineId} is on no run sheet`];
}
