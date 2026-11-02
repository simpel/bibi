import type { Result } from "../../../errors/result";

export type FortnoxTokens = {
  accessToken: string;
  refreshToken: string;
  scope: string;
  /** Seconds until the access token expires (3600). */
  expiresIn: number;
};

/** A refresh either returns new tokens or Fortnox refused the refresh token (reconnect needed). */
export type FortnoxRefresh = { kind: "tokens"; tokens: FortnoxTokens } | { kind: "refused" };

export type FortnoxCompany = {
  name: string;
  organizationNumber: string | null;
  databaseNumber: string | null;
};

export type ExchangeCodeInput = { code: string; codeVerifier: string; redirectUri: string };
export type RefreshTokenInput = { refreshToken: string };
export type AccessTokenInput = { accessToken: string };
export type FortnoxRevoke = { revoked: boolean };

/** What core needs from Fortnox's OAuth server and API (ADR 0087). Tests swap in a fake. */
export type FortnoxGateway = {
  exchangeCode(input: ExchangeCodeInput): Promise<Result<FortnoxTokens>>;
  refresh(input: RefreshTokenInput): Promise<Result<FortnoxRefresh>>;
  revoke(input: RefreshTokenInput): Promise<Result<FortnoxRevoke>>;
  getCompany(input: AccessTokenInput): Promise<Result<FortnoxCompany>>;
};
