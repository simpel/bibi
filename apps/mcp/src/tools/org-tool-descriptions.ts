import {
  type EntityTypeDto,
  type ExecuteContext,
  execute,
  listEntityTypes,
  listVocabularies,
  type VocabularyDto,
} from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { describeOrgFields } from "./describe-org-fields";
import type { McpTool } from "./types";

/** Tools whose description lists the caller organization's own types and fields. */
export const ORG_DESCRIBED_TOOLS: ReadonlySet<string> = new Set([
  "item_list",
  "item_get",
  "item_create",
  "item_update",
]);

type ContextInput = { context: ExecuteContext };

async function loadTypes({ context }: ContextInput): Promise<EntityTypeDto[] | null> {
  const result = await execute({
    operation: listEntityTypes,
    input: { base: "ITEM", limit: 100 },
    context,
  });
  return result.ok ? result.value.items : null;
}

async function loadVocabularies({ context }: ContextInput): Promise<VocabularyDto[]> {
  const result = await execute({ operation: listVocabularies, input: { limit: 100 }, context });
  return result.ok ? result.value.items : [];
}

/** Section for the caller's organization, or "" when they may not read the configuration. */
export async function loadOrgSection({ context }: ContextInput): Promise<string> {
  const types = await loadTypes({ context });
  if (!types) {
    getLogger().debug({ event: "mcp.orgDescriptionsSkipped" });
    return "";
  }
  return describeOrgFields({ types, vocabularies: await loadVocabularies({ context }) });
}

export type WithOrgDescriptionsInput = { tools: readonly McpTool[]; context: ExecuteContext };

/** Appends the org section to the item tools. Reads the configuration as the caller. */
export async function withOrgDescriptions({
  tools,
  context,
}: WithOrgDescriptionsInput): Promise<McpTool[]> {
  const section = await loadOrgSection({ context });
  if (!section) return [...tools];
  return tools.map((tool) =>
    ORG_DESCRIBED_TOOLS.has(tool.name)
      ? { ...tool, description: `${tool.description}\n\n${section}` }
      : tool,
  );
}
