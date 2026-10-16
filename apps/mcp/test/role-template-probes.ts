import type { ExecuteContext } from "@okazi/core";
import { expect } from "vitest";
import { call, connect, type Json } from "./helpers";
import { gqlRequest } from "./parity-graphql";
import { createRestClient, type RestSendInput } from "./parity-rest";

/** One operation, addressed on each surface (ADR 0003). */
export type Probe = { tool: string; args: Json; rest: RestSendInput; gql: string };

/** `OK` for an allowed read; an allowed write on a missing id gets past authorization to `NOT_FOUND`. */
export type Outcome = "OK" | "NOT_FOUND" | "FORBIDDEN";

const MISSING = "missing-id";
const HTTP_STATUS: Record<Outcome, number> = { OK: 200, NOT_FOUND: 404, FORBIDDEN: 403 };

type ReadProbeInput = { tool: string; path: string; field: string };

/** A list query with no input. */
export const readProbe = ({ tool, path, field }: ReadProbeInput): Probe => ({
  tool,
  args: {},
  rest: { method: "GET", path },
  gql: `query { ${field} { items { id } } }`,
});

type WriteProbeInput = { tool: string; method: "PATCH" | "DELETE"; path: string; mutation: string };

/** A command that takes only an id, called on an id that does not exist. */
export const writeProbe = ({ tool, method, path, mutation }: WriteProbeInput): Probe => ({
  tool,
  args: { id: MISSING },
  rest: { method, path: `${path}/${MISSING}`, body: method === "PATCH" ? {} : undefined },
  gql: `mutation { ${mutation}(input: { id: "${MISSING}" }) { id } }`,
});

export type ExpectOutcomeInput = { context: ExecuteContext; probe: Probe; outcome: Outcome };

/** Runs the probe on MCP, REST and GraphQL and expects the same outcome on all three. */
export async function expectOutcome({ context, probe, outcome }: ExpectOutcomeInput) {
  const mcp = await connect({ context });
  const viaMcp = await call({ client: mcp, name: probe.tool, args: probe.args });
  expect(viaMcp.isError ? viaMcp.data.code : "OK", "MCP").toBe(outcome);
  const status = await createRestClient({ context }).send(probe.rest);
  expect(status, "REST").toBe(HTTP_STATUS[outcome]);
  const body = await gqlRequest({ context, query: probe.gql });
  expect(body.errors?.[0]?.extensions?.code ?? "OK", "GraphQL").toBe(outcome);
}
