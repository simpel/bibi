import "server-only";
import { type ItemTypeGroupDto, listItemTypeGroups, type Result } from "@bibi/core";
import { cache } from "react";
import { listAll } from "@/server/list-all";

/**
 * The organization's active item type groups in position order, read once per request.
 * Without `configuration:read` the caller sees no groups (ADR 0050 feature scope), not an error.
 */
export const loadItemTypeGroups = cache(async (): Promise<Result<ItemTypeGroupDto[]>> => {
  const groups = await listAll({ operation: listItemTypeGroups, input: {} });
  if (!groups.ok && groups.error.code === "FORBIDDEN") return { ok: true, value: [] };
  if (!groups.ok) return groups;
  const active = groups.value.filter((group) => group.status === "ACTIVE");
  return { ok: true, value: active.sort((a, b) => a.position - b.position) };
});
