import type { EmbedFn } from "@bibi/core";
import { type Db, getDb } from "@bibi/db";
import { indexStaleEntities } from "./index-stale-entities";
import { reembedStaleRows } from "./reembed-stale-rows";

export type ReindexAllInput = {
  embed: EmbedFn;
  /** Only this org (+ global SYSTEM-skill rows); default every organization. */
  organizationId?: string;
  /** Re-embed the global SYSTEM-skill rows too (default true). */
  includeGlobal?: boolean;
  db?: Db;
  batchSize?: number;
};

export type ReindexReport = {
  model: string;
  /** Rows re-embedded because they were written by another model. */
  reembedded: number;
  /** Entities whose index row was missing or out of date and were (re)indexed. */
  indexed: number;
  organizations: number;
};

const PROBE_TEXT = "bibi";

type ListOrgsInput = { db: Db; organizationId?: string };

const listOrganizationIds = async ({ db, organizationId }: ListOrgsInput): Promise<string[]> => {
  if (organizationId) return [organizationId];
  const rows = await db.organization.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
};

/**
 * Brings the search index in line with the current embedding model: re-embeds every row whose
 * `model` differs (e.g. placeholder → Gateway model) and indexes entities whose row is missing or
 * stale (e.g. after `search.index_failed`).
 * Idempotent; safe to re-run. CLI: `pnpm --filter @bibi/ai reindex [--org <id>]`.
 */
export async function reindexAll({
  embed,
  organizationId,
  includeGlobal = true,
  db = getDb(),
  batchSize = 64,
}: ReindexAllInput): Promise<ReindexReport> {
  const { model } = await embed({ texts: [PROBE_TEXT] });
  const reembedded = await reembedStaleRows({
    db,
    embed,
    model,
    organizationId,
    includeGlobal,
    batchSize,
  });
  const organizations = await listOrganizationIds({
    db,
    ...(organizationId ? { organizationId } : {}),
  });
  let indexed = 0;
  for (const id of organizations) {
    indexed += await indexStaleEntities({ db, embed, organizationId: id });
  }
  return { model, reembedded, indexed, organizations: organizations.length };
}
