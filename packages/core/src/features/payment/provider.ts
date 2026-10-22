import type { Result } from "../../errors/result";

/** What every charge carries: where it lands, how much, and Bibi's optional cut. */
export type ChargeBase = {
  /** The organization's connected account (`acct_...`); the charge is a direct charge on it. */
  connectedAccountId: string;
  /** Minor units (öre for SEK). */
  amountMinor: number;
  /** ISO 4217, upper case. */
  currency: string;
  /** Bibi's application fee in minor units; undefined = none. */
  applicationFeeMinor?: number | undefined;
  /** Shown to the customer on the checkout or invoice line. */
  description: string;
  /** Same key, same charge: a retried request never charges twice. */
  idempotencyKey: string;
  /** Bibi ids for the webhook to find the payment again (never personal data). */
  metadata: Record<string, string>;
};

export type CreateCheckoutInput = ChargeBase & {
  /** Where the customer lands after paying and after giving up. */
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutRef = {
  /** PSP reference (`cs_...`). */
  providerReference: string;
  /** The hosted checkout page. */
  url: string;
  expiresAt: Date;
};

export type InvoiceRecipient = { name: string; email: string };

export type CreateInvoiceInput = ChargeBase & {
  recipient: InvoiceRecipient;
  daysUntilDue: number;
};

export type InvoiceRef = {
  /** PSP reference (`in_...`). */
  providerReference: string;
  /** The hosted invoice page. */
  url: string;
};

/**
 * Payment service provider behind `payment.*` (ADR 0028, 0029), like `MailProvider` (ADR 0012).
 * Every charge is a direct charge on the organization's connected account, so the venue is the
 * merchant and Bibi never holds venue funds. Card checkouts and invoices share this interface.
 */
export type PaymentProvider = {
  createCheckout(input: CreateCheckoutInput): Promise<Result<CheckoutRef>>;
  createInvoice(input: CreateInvoiceInput): Promise<Result<InvoiceRef>>;
};
