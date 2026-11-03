import type { Result } from "../../errors/result";
import type { BillingInterval } from "./schema";

export type CreateCustomerInput = { organizationId: string; name: string; email?: string };

export type CreateBillingCheckoutInput = {
  organizationId: string;
  customerId: string;
  interval: BillingInterval;
  /** Seats beyond the included ones; monthly checkout carries them, yearly adds them later. */
  extraSeats: number;
  /** The rest of Bibi's trial, so paying early charges nothing before it ends. */
  trialEnd: Date | null;
  successUrl: string;
  cancelUrl: string;
};

export type CreatePortalInput = { customerId: string; returnUrl: string };

/** A subscription as read back from Stripe (never taken from a webhook payload). */
export type BillingSubscription = {
  subscriptionId: string;
  customerId: string;
  organizationId: string | null;
  status: string;
  interval: BillingInterval | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  seatQuantity: number;
};

export type SetSeatsInput = { subscriptionId: string; quantity: number };

export type BillingCustomerRef = { customerId: string };
export type BillingRedirectRef = { url: string };

/** What core needs from Stripe Billing on Bibi's own account (ADR 0091, 0095). */
export type BillingGateway = {
  /** False while no superadmin configured billing: nothing is gated then. */
  isConfigured(): Promise<boolean>;
  createCustomer(input: CreateCustomerInput): Promise<Result<BillingCustomerRef>>;
  createCheckout(input: CreateBillingCheckoutInput): Promise<Result<BillingRedirectRef>>;
  createPortal(input: CreatePortalInput): Promise<Result<BillingRedirectRef>>;
  getSubscription(input: { subscriptionId: string }): Promise<Result<BillingSubscription>>;
  /** The customer's newest subscription in any status, or null when there is none. */
  findSubscription(input: { customerId: string }): Promise<Result<BillingSubscription | null>>;
  /** Sets the seat item's quantity (adds or removes the item), prorated. */
  setSeats(input: SetSeatsInput): Promise<Result<true>>;
};
