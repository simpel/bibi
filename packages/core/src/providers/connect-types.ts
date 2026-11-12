import type { z } from "zod";
import type { Result } from "../errors/result";

export type OauthTokens = {
  accessToken: string;
  refreshToken: string;
  scope: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
};

/** A refresh either returns new tokens or the provider refused the refresh token. */
export type OauthRefresh = { kind: "tokens"; tokens: OauthTokens } | { kind: "refused" };

/** The provider's company, snapshotted at connect. */
export type ExternalCompany = {
  name: string;
  organizationNumber: string | null;
  /** The provider's own id for the company (Fortnox database number). */
  tenantId: string | null;
};

export type ExchangeCodeInput = { code: string; codeVerifier: string; redirectUri: string };
export type RefreshTokenInput = { refreshToken: string };
export type AccessTokenInput = { accessToken: string };
export type AuthorizeUrlInput = { state: string; codeChallenge: string };

/** OAuth 2 with PKCE and rotating refresh tokens (Fortnox, Visma; ADR 0087). */
export type OauthConnectPort = {
  kind: "OAUTH";
  /** Refresh tokens die this long after issue. */
  refreshTtlMs: number;
  /** The daily job refreshes a connection whose refresh token has less than this left. */
  refreshWindowMs: number;
  authorizeUrl(input: AuthorizeUrlInput): string;
  redirectUri(): string;
  exchangeCode(input: ExchangeCodeInput): Promise<Result<OauthTokens>>;
  refresh(input: RefreshTokenInput): Promise<Result<OauthRefresh>>;
  revoke(input: RefreshTokenInput): Promise<Result<RevokeOutcome>>;
  describeCompany(input: AccessTokenInput): Promise<Result<ExternalCompany>>;
};

export type CreateAccountInput = {
  organizationId: string;
  displayName: string;
  country: string;
  contactEmail?: string | undefined;
  /** The account this one replaces because the provider no longer knows it; keeps the create idempotent per replacement. */
  replaces?: string | undefined;
};
export type OnboardingLinkInput = {
  externalAccountId: string;
  returnUrl: string;
  refreshUrl: string;
};
export type HostedAccountStatus = "ONBOARDING" | "CONNECTED" | "RESTRICTED";
export type RevokeOutcome = { revoked: boolean };
export type ExternalAccount = { externalAccountId: string };
export type OnboardingLink = { url: string; expiresAt: Date };
export type AccountStatusOutcome = { status: HostedAccountStatus };
export type VerifyCredentialsInput = { credentials: Record<string, unknown> };

/** An account at the provider finished on the provider's own pages (Stripe Connect). */
export type HostedOnboardingPort = {
  kind: "HOSTED_ONBOARDING";
  createAccount(input: CreateAccountInput): Promise<Result<ExternalAccount>>;
  /** NOT_FOUND when the provider no longer knows the account or the platform lost access to it. */
  onboardingLink(input: OnboardingLinkInput): Promise<Result<OnboardingLink>>;
  status(input: ExternalAccount): Promise<Result<AccountStatusOutcome>>;
};

/** Credentials an admin enters in Bibi (Swish certificate, passphrase and number). */
export type CredentialsConnectPort = {
  kind: "CREDENTIALS";
  credentialsSchema: z.ZodType<Record<string, unknown>>;
  verify(input: VerifyCredentialsInput): Promise<Result<ExternalAccount>>;
};

export type ConnectPort = OauthConnectPort | HostedOnboardingPort | CredentialsConnectPort;
export type ConnectKind = ConnectPort["kind"];
