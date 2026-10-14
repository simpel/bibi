import { z } from "zod";

/**
 * An OAuth client (e.g. an MCP client such as Claude Desktop) the signed-in user has connected
 * to this organization (ADR 0005). Always the caller's own grants.
 */
export const OauthGrantSchema = z.object({
  /** Same as `clientId`: a user has at most one grant per client and organization. */
  id: z.string(),
  clientId: z.string(),
  /** The client's registered name, or its id when it has none. */
  name: z.string(),
  scopes: z.array(z.string()),
  connectedAt: z.date(),
});

export const OauthGrantListInputSchema = z.object({});

export const OauthGrantListOutputSchema = z.object({
  items: z.array(OauthGrantSchema),
  /** Always null: a user has few grants, so they come in one page. */
  nextCursor: z.string().nullable(),
});

export const OauthGrantRevokeInputSchema = z.object({
  clientId: z.string().min(1).describe("Client id from oauthGrant.list"),
});

export type OauthGrantDto = z.infer<typeof OauthGrantSchema>;
