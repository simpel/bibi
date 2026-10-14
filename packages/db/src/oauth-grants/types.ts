import type { Db } from "../client";

/** One OAuth client a user has connected in one organization (refresh tokens and/or consent). */
export type OauthGrantRow = {
  clientId: string;
  clientName: string | null;
  scopes: string[];
  connectedAt: Date;
};

export type ListOauthGrantsInput = { organizationId: string; userId: string };

export type RevokeOauthGrantInput = ListOauthGrantsInput & { clientId: string };

export type WithDb<T> = T & { db: Db };
