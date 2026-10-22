import {
  type Actor,
  createExecuteContext,
  type ExecuteContext,
  type PermissionSet,
  PRESET_PERMISSIONS,
} from "@bibi/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createId } from "@paralleldrive/cuid2";
import { createMcpServer } from "../src/server/create-mcp-server";
import { fakeEmbed } from "./fake-embed";

/** Shorthand for a preset (ADR 0050): read → member, write → manager, admin → admin. */
const PRESET_FOR_ACCESS = { read: "member", write: "manager", admin: "admin" } as const;
export type TestAccess = keyof typeof PRESET_FOR_ACCESS;

export type TestContextInput = {
  organizationId?: string;
  /** The preset's permissions (default `admin`), or explicit `permissions`. */
  access?: TestAccess;
  permissions?: PermissionSet;
  actor?: Actor;
};

/** Fresh org per call: tests never share rows, so no cleanup is needed. */
export function testContext({
  organizationId = `org_${createId()}`,
  access = "admin",
  permissions = PRESET_PERMISSIONS[PRESET_FOR_ACCESS[access]],
  actor = { type: "user", userId: `user_${createId()}` },
}: TestContextInput = {}): ExecuteContext {
  return createExecuteContext({
    organizationId,
    roles: [PRESET_FOR_ACCESS[access]],
    permissions,
    actor,
  });
}

export type ConnectInput = { context: ExecuteContext };

/** In-memory MCP client wired to a server bound to `context`. */
export async function connect({ context }: ConnectInput): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createMcpServer({ context, embed: fakeEmbed }).connect(serverTransport);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON for test assertions
export type Json = any;

export type CallInput = { client: Client; name: string; args?: Record<string, unknown> };
export type CallOutput = { isError: boolean; data: Json };

/** Calls a tool and returns `structuredContent` (what UIs and agents read). */
export async function call({ client, name, args = {} }: CallInput): Promise<CallOutput> {
  const result = await client.callTool({ name, arguments: args });
  return { isError: result.isError === true, data: result.structuredContent };
}
