import type { OrderVersionLine } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { VersionLine } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const toVersionLine = ({ row }: { row: OrderVersionLine }): VersionLine => {
  const { id: _id, organizationId: _org, versionId: _v, position: _p, ...line } = row;
  const { createdAt: _c, updatedAt: _u, createdBy: _b, ...content } = line;
  return {
    ...content,
    discountPercent: row.discountPercent === null ? null : row.discountPercent.toNumber(),
    fields: (row.fields ?? {}) as Record<string, unknown>,
  };
};

/** The lines of several versions in one query, each in its stored order. */
export async function loadVersionLines({
  context,
  versionIds,
}: Db & { versionIds: readonly string[] }): Promise<Map<string, VersionLine[]>> {
  const rows = await context.db.orderVersionLine.findMany({
    where: { versionId: { in: [...versionIds] } },
    orderBy: [{ versionId: "asc" }, { position: "asc" }],
  });
  const byVersion = new Map<string, VersionLine[]>();
  for (const row of rows) {
    byVersion.set(row.versionId, [...(byVersion.get(row.versionId) ?? []), toVersionLine({ row })]);
  }
  return byVersion;
}

/** `select` for a version row as the operations show it. */
export const VERSION_SELECT = {
  ...{ id: true, orderId: true, number: true, name: true, restoredFromId: true },
  ...{ contentHash: true, capturedAt: true, createdBy: true, createdAt: true },
  ...{ estimatedHeadcount: true, guaranteedHeadcount: true },
  restoredFrom: { select: { number: true } },
  quotes: {
    where: { status: "ACTIVE" },
    select: { id: true, version: true, quoteStatus: true, totalInclVatMinor: true },
    orderBy: { version: "asc" },
  },
} as const;

/** The active version, or null when missing or in another organization. */
export const loadVersion = ({ context, id }: Db & { id: string }) =>
  context.db.orderVersion.findFirst({ where: { id }, select: VERSION_SELECT });

export type VersionRow = NonNullable<Awaited<ReturnType<typeof loadVersion>>>;
