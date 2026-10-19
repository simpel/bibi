import type { Prisma } from "@okazi/db";
import type { OperationContext } from "../operations/types";

/** One `LINK` field value as `RecordLink` rows (ADR 0056): the field and its targets, in order. */
export type LinkValue = { fieldId: string; targetIds: readonly string[] };

/** The `RecordLink` rows a record's `LINK` values are read from, in the stored order. */
export const RECORD_LINKS_SELECT = {
  links: {
    select: { targetRecordId: true, field: { select: { key: true } } },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.RecordSelect;

/** `include` on an extending row (`Item`, `Ticket`, …) that loads its record's links. */
export const RECORD_LINKS_INCLUDE = { select: RECORD_LINKS_SELECT } as const;

export type StoredLink = { targetRecordId: string; field: { key: string } };

export type LoadRecordLinksInput = {
  context: Pick<OperationContext, "db">;
  recordIds: readonly string[];
};

/** The `LINK` values of several records in one query, each row with its `recordId`. */
export const loadRecordLinks = ({ context, recordIds }: LoadRecordLinksInput) =>
  context.db.recordLink.findMany({
    where: { recordId: { in: [...recordIds] } },
    select: { recordId: true, ...RECORD_LINKS_SELECT.links.select },
    orderBy: RECORD_LINKS_SELECT.links.orderBy,
  });

export type WithLinksInput = {
  /** The stored `fields` JSON (scalars and choices only). */
  fields: unknown;
  links: readonly StoredLink[];
};

const asObject = ({ value }: { value: unknown }): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * The API's one `fields` object (ADR 0056): stored scalars plus each `LINK` field's targets, as
 * the target id (one row) or the ids in order (several rows).
 */
export function withLinks({ fields, links }: WithLinksInput): Record<string, unknown> {
  const targets = new Map<string, string[]>();
  for (const { targetRecordId, field } of links) {
    targets.set(field.key, [...(targets.get(field.key) ?? []), targetRecordId]);
  }
  const merged: Record<string, unknown> = { ...asObject({ value: fields }) };
  for (const [key, ids] of targets) merged[key] = ids.length === 1 ? ids[0] : ids;
  return merged;
}

export type ReplaceRecordLinksInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  recordId: string;
  links: readonly LinkValue[];
};

/**
 * Replaces a record's `LINK` values with `links` (a replacement set; the audit has the record).
 * The composite foreign keys refuse a target or field of another organization.
 */
export async function replaceRecordLinks({ context, recordId, links }: ReplaceRecordLinksInput) {
  const { organizationId } = context;
  await context.db.recordLink.deleteMany({ where: { recordId } });
  const data = links.flatMap(({ fieldId, targetIds }) =>
    targetIds.map((targetRecordId, position) => ({
      recordId,
      fieldId,
      targetRecordId,
      position,
      organizationId,
    })),
  );
  if (data.length > 0) await context.db.recordLink.createMany({ data });
}

/** `include` for an extending row whose `fields` are read: its record's `LINK` values. */
export const WITH_RECORD_LINKS = { record: RECORD_LINKS_INCLUDE } as const;

/** An extending row read with `WITH_RECORD_LINKS`. */
export type WithRecordLinks = { fields: unknown; record: { links: readonly StoredLink[] } };

export type RecordFieldsInput = { row: WithRecordLinks };

/** The row's API `fields`: stored scalars merged with its record's links (ADR 0056). */
export const recordFields = ({ row }: RecordFieldsInput) =>
  withLinks({ fields: row.fields, links: row.record.links });
