import { ok } from "../errors/result";
import { DEFAULT_ARCHIVE_RETENTION_DAYS } from "../features/organization-profile/retention";
import { defineOperation } from "../operations/define-operation";
import type { OperationContext } from "../operations/types";
import { nowOf } from "../time/now";
import { PURGE_KINDS } from "./purge-kinds";
import { ArchiveListExpiredInputSchema, ArchiveListExpiredOutputSchema } from "./schema";

const DAY_MS = 86_400_000;

/** The instant before which archived records are due: now minus the organization's retention. */
async function dueBefore({ context }: { context: OperationContext }): Promise<Date> {
  const profile = await context.db.organizationProfile.findFirst({
    select: { archiveRetentionDays: true },
  });
  const days = profile?.archiveRetentionDays ?? DEFAULT_ARCHIVE_RETENTION_DAYS;
  return new Date(nowOf({ context }).getTime() - days * DAY_MS);
}

/**
 * The records the retention job deletes (ADR 0118): archived longer than the organization's
 * `archiveRetentionDays`, in `PURGE_KINDS` order, each with the delete operation that deletes it.
 */
export const listExpiredArchives = defineOperation({
  name: "archive.listExpired",
  kind: "query",
  description:
    "The archived records whose retention has passed, in the order the retention job deletes " +
    "them. Run by the system only.",
  input: ArchiveListExpiredInputSchema,
  output: ArchiveListExpiredOutputSchema,
  permission: "configuration:read",
  systemOnly: true,
  handler: async ({ context }) => {
    const before = await dueBefore({ context });
    const items = [];
    for (const { kind, operation } of PURGE_KINDS) {
      const rows = await kind.archived({ context, before });
      items.push(...rows.map(({ id }) => ({ operation: operation.name, id })));
    }
    return ok({ value: { items } });
  },
});
