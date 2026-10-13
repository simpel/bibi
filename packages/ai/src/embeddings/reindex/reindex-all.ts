import type { EmbedFn } from "@okazi/core";
import { type Db, getDb } from "@okazi/db";
import { indexMissingEntities } from "./index-missing-entities";
import { reembedStaleRows } from "./reembed-stale-rows";

export type ReindexAllInput = {
  embed: EmbedFn;
  /** Only this org (+ global SYSTEM-skill rows); default every organization. */
  organizationId?: string;
  db?: Db;
  batchSize?: number;
};

export type ReindexReport = {
  model: string;
  /** Rows re-embedded because they were written by another model. */
  reembedded: number;
  /** Entities that had no index row and were indexed. */
  indexed: number;
  organizations: number;
};

const PROBE_TEXT = "okazi";

type ListOrgsInput = { db: Db; organizationId?: string };

const listOrganizationIds = async ({ db, organizationId }: ListOrgsInput): Promise<string[]> => {
  if (organizationId) return [organizationId];
  const rows = await db.organization.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
};

/**
 * Brings the search index in line with the current embedding model: re-embeds every row whose
 * `model` differs (e.g. placeholder → Gateway model) and indexes entities missing a row.
 * Idempotent; safe to re-run. CLI: `pnpm --filter @okazi/ai reindex [--org <id>]`.
 */
export async function reindexAll({
  embed,
  organizationId,
  db = getDb(),
  batchSize = 64,
}: ReindexAllInput): Promise<ReindexReport> {
  const { model } = await embed({ texts: [PROBE_TEXT] });
  const reembedded = await reembedStaleRows({ db, embed, model, organizationId, batchSize });
  const organizations = await listOrganizationIds({ db, ...(organizationId ? { organizationId } : {}) });
  let indexed = 0;
  for (const id of organizations) {
    indexed += await indexMissingEntities({ db, embed, organizationId: id });
  }
  return { model, reembedded, indexed, organizations: organizations.length };
}
