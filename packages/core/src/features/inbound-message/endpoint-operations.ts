import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { endpointLastReceived } from "./endpoint-last-received";
import { InboundEndpointSchema, InboundEndpointSetEmailInputSchema } from "./endpoint-schema";
import { toInboundEndpointDto } from "./to-inbound-endpoint-dto";

/**
 * Edits the organization's inbox mail address (ADR 0085 decision 2): the part before @ on Bibi's
 * inbound domain, and the organization's own address that forwards to it. Creates the EMAIL
 * endpoint when the organization has none (its slug was taken when it was provisioned).
 */
export const setInboundEndpointEmail = defineOperation({
  name: "inboundEndpoint.setEmail",
  kind: "command",
  description:
    "Edit the organization's inbox mail address: `localPart` is the part before @ on Bibi's " +
    "inbound domain (lowercase letters, digits, dots, hyphens, underscores; `order-` and mail " +
    "role names are reserved). Unique across all organizations: a taken one is CONFLICT. The old " +
    "address stops receiving at once, so forwarding must point to the new one. `publicAddress` " +
    "is the organization's own address that forwards here, shown in the setup steps.",
  input: InboundEndpointSetEmailInputSchema,
  output: InboundEndpointSchema,
  permission: "configuration:write",
  entityType: "inboundEndpoint",
  handler: async ({ input: { localPart, publicAddress }, context }) => {
    const before = await context.db.inboundEndpoint.findFirst({
      where: { channel: "EMAIL", status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    const data = { address: localPart, publicAddress };
    // A taken address fails the unique index and is returned as CONFLICT by `execute`.
    const row = before
      ? await context.db.inboundEndpoint.update({ where: { id: before.id }, data })
      : await context.db.inboundEndpoint.create({
          data: {
            ...data,
            channel: "EMAIL",
            name: "Email",
            organizationId: context.organizationId,
          },
        });
    context.recordChange({
      entityId: row.id,
      before: before ? { address: before.address, publicAddress: before.publicAddress } : null,
      after: data,
    });
    const last = await endpointLastReceived({ context, endpointIds: [row.id] });
    return ok({ value: toInboundEndpointDto({ row, lastReceivedAt: last.get(row.id) ?? null }) });
  },
});
