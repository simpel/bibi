import { z } from "zod";
import { InboundChannelSchema } from "./schema";

/**
 * Where an organization's messages come in (ADR 0085 decision 2). `address` is derived: for
 * EMAIL `<local part>@MAIL_INBOUND_DOMAIN` (null while no inbound domain is configured), null
 * for the API endpoint. `lastReceivedAt` is derived from the endpoint's messages.
 */
export const InboundEndpointSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  channel: InboundChannelSchema,
  address: z.string().nullable(),
  localPart: z
    .string()
    .nullable()
    .describe(
      "EMAIL: the part of the inbox address before @, editable with inboundEndpoint.setEmail",
    ),
  publicAddress: z
    .string()
    .nullable()
    .describe("EMAIL: the organization's own address that forwards to the inbox address"),
  lastReceivedAt: z
    .date()
    .nullable()
    .describe("When the newest message arrived on this endpoint; null when none has yet"),
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

/** Prefixes and names an inbox address may not take: order reply routes and mail roles. */
const RESERVED_LOCAL_PART =
  /^(order-|booking-)|^(postmaster|abuse|hostmaster|webmaster|mailer-daemon)$/;

export const InboundEndpointSetEmailInputSchema = z.object({
  localPart: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/, {
      message: "Use letters a-z, digits, dots, hyphens and underscores",
    })
    .refine((value) => !RESERVED_LOCAL_PART.test(value), { message: "This address is reserved" })
    .describe("The part before @ of the inbox address, e.g. bookings"),
  publicAddress: z
    .email()
    .max(254)
    .nullable()
    .describe(
      "The organization's own address that forwards here, e.g. bookings@venue.se; null for none",
    ),
});

export type InboundEndpointDto = z.infer<typeof InboundEndpointSchema>;
export type InboundEndpointPage = z.infer<typeof InboundEndpointListOutputSchema>;
export type InboundEndpointSetEmailInput = z.infer<typeof InboundEndpointSetEmailInputSchema>;
