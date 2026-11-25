import "server-only";
import { listMembers } from "@bibi/core";
import { cache } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { runOperation } from "@/server/run-operation";

/**
 * The organization's members by user id (`id` = user id), for task assignees, once per request.
 * Without `member:read` the list is empty and assignees show as "–".
 */
export const loadMemberNames = cache(async (): Promise<NamedOption[]> => {
  const result = await runOperation({ operation: listMembers, input: { limit: 100 } });
  return result.ok ? result.value.items.map(({ userId, name }) => ({ id: userId, name })) : [];
});
