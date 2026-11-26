import type { ArchivedRow } from "../../archive/lifecycle-kind";
import { PURGE_KINDS, type PurgeKind } from "../../archive/purge-kinds";
import { ok } from "../../errors/result";
import { checkPermission } from "../../operations/check-permission";
import { defineOperation } from "../../operations/define-operation";
import type { Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { DEFAULT_ARCHIVE_RETENTION_DAYS } from "../organization-profile/retention";
import { type ArchivedRecord, ArchiveListInputSchema, ArchiveListOutputSchema } from "./schema";

const DAY_MS = 86_400_000;

type KindRowsInput = { context: OperationContext; purge: PurgeKind; query?: string };

/** The kind's archived rows the caller may restore and delete, matching `query`. */
async function kindRows({ context, purge, query }: KindRowsInput): Promise<ArchivedRow[]> {
  const permission = purge.operation.permission as Permission;
  if (!checkPermission({ context, permission }).ok) return [];
  const { kind } = purge;
  const needle = query?.toLowerCase();
  const rows = (await kind.archived({ context })).filter(
    (row) => !needle || row.name.toLowerCase().includes(needle),
  );
  if (!kind.check) return rows;
  // A per-record rule (skills: owner or admin): keep only what restore and delete would allow.
  const allowed = await Promise.all(
    rows.map(async (row) => {
      const found = await kind.find({ context, id: row.id });
      return found !== null && (kind.check?.({ context, id: row.id, row: found.row }).ok ?? true);
    }),
  );
  return rows.filter((_, index) => allowed[index]);
}

/**
 * The Archive page (ADR 0118): every archived record with its own page that the caller may
 * restore and delete (its kind's `delete` permission), newest first, with when the retention job
 * deletes it.
 */
export const listArchived = defineOperation({
  name: "archive.list",
  kind: "query",
  description:
    "Archived records of every kind (customers, items, orders, tasks, types, lists and more) that " +
    "the caller may restore or delete, newest first, each with the date it will be deleted and " +
    "the restore and delete operations to call. Filter by kind or by text in the name.",
  input: ArchiveListInputSchema,
  output: ArchiveListOutputSchema,
  permission: "self:read",
  handler: async ({ input, context }) => {
    const profile = await context.db.organizationProfile.findFirst({
      select: { archiveRetentionDays: true },
    });
    const retentionDays = profile?.archiveRetentionDays ?? DEFAULT_ARCHIVE_RETENTION_DAYS;
    const kinds = PURGE_KINDS.filter(
      (purge) => !input.kind || purge.kind.entityType === input.kind,
    );
    const items: ArchivedRecord[] = [];
    for (const purge of kinds) {
      const rows = await kindRows({ context, purge, query: input.query });
      items.push(
        ...rows.map((row) => ({
          kind: purge.kind.entityType,
          label: purge.kind.label,
          id: row.id,
          name: row.name,
          archivedAt: row.archivedAt,
          deletesAt: row.archivedAt
            ? new Date(row.archivedAt.getTime() + retentionDays * DAY_MS)
            : null,
          restoreOperation: purge.restore.name,
          deleteOperation: purge.operation.name,
        })),
      );
    }
    items.sort((a, b) => (b.archivedAt?.getTime() ?? 0) - (a.archivedAt?.getTime() ?? 0));
    const truncated = items.length > input.limit;
    return ok({ value: { items: items.slice(0, input.limit), truncated, retentionDays } });
  },
});
