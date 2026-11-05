import "server-only";
import { type EntityTypeDto, listEntityTypes, type Result } from "@bibi/core";
import { cache } from "react";
import { listAll } from "./list-all";

export type EntityTypesPage = { items: EntityTypeDto[] };

/**
 * Every entity type of the organization, read once per request (ADR 0097 §3). Callers pick their
 * base with `loadEntityTypesOf`; a refusal comes back as the same `Result` an operation gives.
 */
export const loadEntityTypes = cache(async (): Promise<Result<EntityTypesPage>> => {
  const all = await listAll({ operation: listEntityTypes, input: {} });
  return all.ok ? { ok: true, value: { items: all.value } } : all;
});

export type LoadEntityTypesOfInput = { base: EntityTypeDto["base"] };

/** The types of one base, filtered in memory from the request's single read. */
export async function loadEntityTypesOf({
  base,
}: LoadEntityTypesOfInput): Promise<Result<EntityTypesPage>> {
  const all = await loadEntityTypes();
  if (!all.ok) return all;
  return { ok: true, value: { items: all.value.items.filter((type) => type.base === base) } };
}
