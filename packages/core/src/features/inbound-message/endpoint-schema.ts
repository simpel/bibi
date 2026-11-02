import { z } from "zod";
import { InboundChannelSchema } from "./schema";

/**
 * Where an organization's messages come in (ADR 0085 decision 2). `address` is derived: for
 * EMAIL `<local part>@MAIL_INBOUND_DOMAIN` (null while no inbound domain is configured), null
 * for the API endpoint.
 */
export const InboundEndpointSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  channel: InboundChannelSchema,
  address: z.string().nullable(),
  name: z.string(),
  active: z.boolean(),
  defaultEntityTypeId: z.string().nullable(),
  defaultTemplateId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InboundEndpointListInputSchema = z.object({
  channel: InboundChannelSchema.optional().describe("Only endpoints of this channel"),
});

export const InboundEndpointListOutputSchema = z.object({ items: z.array(InboundEndpointSchema) });

export const InboundEndpointProvisionInputSchema = z.object({
  emailLocalPart: z
    .string()
    .min(1)
    .max(64)
    .nullable()
    .describe("The organization slug, or null when its address is taken"),
});

export type InboundEndpointDto = z.infer<typeof InboundEndpointSchema>;
export type InboundEndpointPage = z.infer<typeof InboundEndpointListOutputSchema>;
