import { Prisma, SYSTEM_ACTOR_ID } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import { nowOf } from "../../time/now";
import { loadOrderContent, type OrderContent } from "./content";

/** Edits by one actor within this window collapse into the newest version (ADR 0116). */
export const COLLAPSE_MS = 30 * 60_000;

type Context = Pick<OperationContext, "db" | "actor" | "now" | "organizationId">;

const actorIdOf = ({ context }: { context: Context }) =>
  context.actor.userId ?? context.actor.apiKeyId ?? SYSTEM_ACTOR_ID;

type LineRowsInput = { context: Context; versionId: string; content: OrderContent };

/** The version's line rows, in the content's order. */
const lineRows = ({ context, versionId, content }: LineRowsInput) =>
  content.lines.map((line, position) => ({
    ...line,
    organizationId: context.organizationId,
    versionId,
    position,
    discountPercent:
      line.discountPercent === null ? null : new Prisma.Decimal(line.discountPercent),
    fields: toJson({ value: line.fields }) ?? {},
  }));

type LatestInput = { context: Context; orderId: string };

/** The order's newest version with what decides whether an edit may collapse into it. */
const latestVersion = ({ context, orderId }: LatestInput) =>
  context.db.orderVersion.findFirst({
    where: { orderId },
    orderBy: { number: "desc" },
    select: {
      ...{ id: true, number: true, name: true, restoredFromId: true, contentHash: true },
      ...{ capturedAt: true, createdBy: true, _count: { select: { quotes: true } } },
    },
  });

type Latest = NonNullable<Awaited<ReturnType<typeof latestVersion>>>;

/** Unnamed, not restored, not sent, the same actor's and captured within the window. */
function collapsible({ latest, context }: { latest: Latest; context: Context }) {
  const recent = nowOf({ context }).getTime() - latest.capturedAt.getTime() < COLLAPSE_MS;
  return (
    recent &&
    latest.name === null &&
    latest.restoredFromId === null &&
    latest._count.quotes === 0 &&
    latest.createdBy === actorIdOf({ context })
  );
}

export type CaptureInput = {
  context: Context;
  orderId: string;
  /** Set by a restore: always a new version, never collapsed into. */
  restoredFromId?: string;
  /** Never overwrite the newest version; still nothing new when the content equals it. */
  fresh?: boolean;
};

/**
 * Captures the order's content as a version after a change (ADR 0116): nothing when it equals the
 * newest version, the newest version overwritten when the edit collapses into it, else a new
 * version. Returns the version that now holds the content, or null for a missing order.
 */
export async function captureOrderVersion({
  context,
  orderId,
  restoredFromId,
  fresh = false,
}: CaptureInput): Promise<{ id: string } | null> {
  const content = await loadOrderContent({ context, orderId });
  if (!content) return null;
  const latest = await latestVersion({ context, orderId });
  if (latest && latest.contentHash === content.hash && !restoredFromId) return { id: latest.id };
  const data = {
    contentHash: content.hash,
    estimatedHeadcount: content.estimatedHeadcount,
    guaranteedHeadcount: content.guaranteedHeadcount,
    capturedAt: nowOf({ context }),
  };
  if (latest && !restoredFromId && !fresh && collapsible({ latest, context })) {
    await context.db.orderVersionLine.deleteMany({ where: { versionId: latest.id } });
    await context.db.orderVersion.update({ where: { id: latest.id }, data });
    await context.db.orderVersionLine.createMany({
      data: lineRows({ context, versionId: latest.id, content }),
    });
    return { id: latest.id };
  }
  const created = await context.db.orderVersion.create({
    data: {
      ...data,
      organizationId: context.organizationId,
      orderId,
      number: (latest?.number ?? 0) + 1,
      restoredFromId,
    },
    select: { id: true },
  });
  await context.db.orderVersionLine.createMany({
    data: lineRows({ context, versionId: created.id, content }),
  });
  return created;
}

/**
 * The version a quote is sent as (ADR 0116): the newest when it holds the order now, else a new
 * one (never collapsed into the newest, which may be someone else's work in progress).
 */
export async function versionForQuote({ context, orderId }: LatestInput) {
  return captureOrderVersion({ context, orderId, fresh: true });
}
