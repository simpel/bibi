import { isDeepStrictEqual } from "node:util";
import type { Order } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import type { RunSheetDefinitionDto } from "../run-sheet-definition/schema";
import { diffContent } from "./diff-content";
import type { RunSheetContent, RunSheetMatch } from "./schema";
import {
  toRunSheetDto,
  RUN_SHEET_INCLUDE,
  type RunSheetWithRecipients,
} from "./to-run-sheet-dto";

type Db = { context: Pick<OperationContext, "db" | "organizationId"> };
type Of = { orderId: string; runSheetDefinitionId: string };

/** The newest version of an order's run sheet, and the newest one that was published. */
export async function findVersions({ context, orderId, runSheetDefinitionId }: Db & Of) {
  const where = { orderId, runSheetDefinitionId };
  const [latest, published] = await Promise.all([
    context.db.runSheet.findFirst({
      where,
      orderBy: { version: "desc" },
      include: RUN_SHEET_INCLUDE,
    }),
    context.db.runSheet.findFirst({
      where: { ...where, publishedAt: { not: null } },
      orderBy: { version: "desc" },
      include: RUN_SHEET_INCLUDE,
    }),
  ]);
  return { latest, published, sent: published };
}

export type SameAsLatestInput = {
  latest: RunSheetWithRecipients;
  content: RunSheetContent;
  matches: RunSheetMatch[];
  definition: RunSheetDefinitionDto;
};

/** An unchanged order, matches and responsibility gives no new version. */
export const sameAsLatest = ({ latest, content, matches, definition }: SameAsLatestInput) =>
  latest.responsibilityId === definition.responsibilityId &&
  isDeepStrictEqual(latest.content, toJson({ value: content })) &&
  isDeepStrictEqual(latest.matches, toJson({ value: matches }));

export type CreateVersionInput = Db & {
  order: Order;
  definition: RunSheetDefinitionDto;
  content: RunSheetContent;
  matches: RunSheetMatch[];
  latest: RunSheetWithRecipients | null;
  published?: RunSheetWithRecipients | null;
  sent?: RunSheetWithRecipients | null;
};

/**
 * The next version, with the rows marked ★ that differ from the last published version. The only writer
 * of the `current` projection: the new version takes it from the previous one.
 */
export async function createVersion({
  context,
  order,
  definition,
  content,
  matches,
  latest,
  published,
  sent,
}: CreateVersionInput) {
  const base = published ?? sent;
  const before = base ? toRunSheetDto({ row: base }).content : null;
  await context.db.runSheet.updateMany({
    where: { orderId: order.id, runSheetDefinitionId: definition.id, current: true },
    data: { current: false },
  });
  return context.db.runSheet.create({
    data: {
      organizationId: context.organizationId,
      orderId: order.id,
      runSheetDefinitionId: definition.id,
      version: (latest?.version ?? 0) + 1,
      responsibilityId: definition.responsibilityId,
      content: toJson({ value: content }) ?? {},
      changes: toJson({ value: diffContent({ before, after: content }) }) ?? [],
      matches: toJson({ value: matches }) ?? [],
      blocked: matches.some((match) => match.blocking),
      baseVersion: base?.version ?? null,
      current: true,
    },
    include: RUN_SHEET_INCLUDE,
  });
}
