import type { Result } from "../../errors/result";
import type { PaymentAccountStatus } from "./schema";

export type CreateConnectedAccountInput = {
  organizationId: string;
  displayName: string;
  country: string;
  contactEmail?: string | undefined;
};
export type ConnectedAccountRef = { stripeAccountId: string };

export type AccountStatusInput = { stripeAccountId: string };
export type ConnectedAccountStatus = { status: Exclude<PaymentAccountStatus, "NOT_CONNECTED"> };

export type OnboardingLinkInput = {
  stripeAccountId: string;
  returnUrl: string;
  refreshUrl: string;
};
export type OnboardingLink = { url: string; expiresAt: Date };

/** What core needs from Stripe Connect (ADR 0028). The default talks to Accounts v2. */
export type StripeConnectGateway = {
  createAccount(input: CreateConnectedAccountInput): Promise<Result<ConnectedAccountRef>>;
  getAccountStatus(input: AccountStatusInput): Promise<Result<ConnectedAccountStatus>>;
  createOnboardingLink(input: OnboardingLinkInput): Promise<Result<OnboardingLink>>;
};
