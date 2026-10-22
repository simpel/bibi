import { invitationMailHook } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { createIndexingHook, type EmbedFn } from "@bibi/core";
import { createApprovalConfirmTool } from "../tools/approval-confirm-tool";
import { createGraphqlQueryTool, createGraphqlSchemaTool } from "../tools/graphql-tools";
import { findMcpToolMeta } from "../tools/meta-registry";
import { createOperationTool } from "../tools/operation-tool";
import type { McpTool } from "../tools/types";
import { getOperations } from "./get-operations";

const cache = new WeakMap<EmbedFn, McpTool[]>();

export type CreateToolsInput = { embed: EmbedFn };

/** Every MCP tool, generated from the core operations plus the generic graph and approval tools. */
export function createTools({ embed }: CreateToolsInput): McpTool[] {
  const cached = cache.get(embed);
  if (cached) return cached;
  const operations = getOperations({ embed });
  const afterCommit = [createIndexingHook({ embed }), invitationMailHook];
  const secret = getEnv().BETTER_AUTH_SECRET;
  const tools = [
    ...operations.map((operation) =>
      createOperationTool({
        operation,
        meta: findMcpToolMeta({ operation: operation.name }),
        afterCommit,
        secret,
      }),
    ),
    createApprovalConfirmTool({ operations, afterCommit, secret }),
    createGraphqlSchemaTool(),
    createGraphqlQueryTool({ embed }),
  ];
  cache.set(embed, tools);
  return tools;
}
