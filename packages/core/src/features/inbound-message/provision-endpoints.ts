import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { ExecuteContext } from "../../operations/context";
import { defineOperation } from "../../operations/define-operation";
import { execute } from "../../operations/execute";
import {
  InboundEndpointListOutputSchema,
  InboundEndpointProvisionInputSchema,
} from "./endpoint-schema";
import { toInboundEndpointDto } from "./to-inbound-endpoint-dto";

/**
 * Gives an organization its EMAIL endpoint (`<slug>@MAIL_INBOUND_DOMAIN`) and its API endpoint
 * (ADR 0085 decision 2). SYSTEM only and not registered (provisioning runs it); a channel that
 * already has an endpoint is skipped, so running it again changes nothing.
 */
export const provisionInboundEndpoints = defineOperation({
  name: "inboundEndpoint.provision",
  kind: "command",
  description: "Create the organization's default inbound endpoints (provisioning only).",
  input: InboundEndpointProvisionInputSchema,
  output: InboundEndpointListOutputSchema,
  permission: "configuration:write",
  approval: false,
  aiAllowed: false,
  handler: async ({ input: { emailLocalPart }, context }) => {
    if (context.actor.type !== "system") {
      const message = "Endpoints are provisioned by the system only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const existing = await context.db.inboundEndpoint.findMany({ select: { channel: true } });
    const has = new Set(existing.map((row) => row.channel));
    const wanted = [
      ...(emailLocalPart
        ? [{ channel: "EMAIL" as const, address: emailLocalPart, name: "Email" }]
        : []),
      { channel: "API" as const, address: null, name: "API" },
    ].filter((endpoint) => !has.has(endpoint.channel));
    const items = [];
    for (const data of wanted) {
      const row = await context.db.inboundEndpoint.create({
        data: { ...data, organizationId: context.organizationId },
      });
      context.recordChange({ entityId: row.id, after: { id: row.id, channel: row.channel } });
      items.push(toInboundEndpointDto({ row }));
    }
    return ok({ value: { items } });
  },
});

export type ProvisionEndpointsInput = { context: ExecuteContext; db?: Db };

/**
 * Runs `inboundEndpoint.provision` for the context's organization. The slug's address is checked
 * across organizations first: a slug another organization's endpoint already holds (it renamed
 * away from it) gets no EMAIL endpoint, logged as `inbox.addressTaken`.
 */
export async function provisionEndpoints({
  context,
  db = getDb(),
}: ProvisionEndpointsInput): Promise<Result<true>> {
  const { organizationId } = context;
  const org = await db.organization.findUnique({ where: { id: organizationId } });
  const slug = org?.slug.toLowerCase() ?? null;
  const where = {
    channel: "EMAIL" as const,
    address: slug,
    organizationId: { not: organizationId },
  };
  const taken = slug ? (await db.inboundEndpoint.count({ where })) > 0 : false;
  if (taken) getLogger().warn({ event: "inbox.addressTaken", organizationId });
  const input = { emailLocalPart: taken ? null : slug };
  const made = await execute({ operation: provisionInboundEndpoints, input, context });
  return made.ok ? ok({ value: true }) : made;
}
