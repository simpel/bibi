import type { Db } from "@bibi/db";
import type { Result } from "../errors/result";
import type { ConnectPort } from "./connect-types";
import type { PaymentMethodKey, ProviderKey } from "./provider-keys";
import type { ProviderSignal } from "./signal";

export type * from "./connect-types";
export type * from "./provider-keys";
export type * from "./signal";

/**
 * What a provider call acts with: the connection's account id and, for OAuth, a fresh token; for
 * a CREDENTIALS provider its sealed credentials, which only the adapter opens.
 */
export type ProviderAuth = {
  externalAccountId: string | null;
  accessToken: string | null;
  credentialsSealed?: string | null;
};

export type StartAttemptInput = {
  auth: ProviderAuth;
  method: PaymentMethodKey;
  /** Minor units (öre for SEK). */
  amountMinor: number;
  /** ISO 4217, upper case. */
  currency: string;
  /** Bibi's application fee in minor units; undefined = none. */
  applicationFeeMinor?: number | undefined;
  /** Shown to the customer on the checkout or invoice line. */
  description: string;
  /** Same key, same attempt: a retried request never charges twice. */
  idempotencyKey: string;
  /** Bibi ids for an event to find the payment again (never personal data). */
  metadata: Record<string, string>;
  /** Where the customer lands after paying, and after giving up. */
  successUrl: string;
  cancelUrl: string;
  /** Who an invoice goes to, and when it is due. */
  recipient: { name: string; email: string };
  daysUntilDue: number;
};

export type AttemptRef = {
  /** The provider's id for the attempt (Stripe `cs_...` or `in_...`). */
  providerReference: string;
  url: string | null;
  qrToken: string | null;
  expiresAt: Date | null;
};

export type AttemptRefInput = { auth: ProviderAuth; providerReference: string };

export type RefundInput = AttemptRefInput & {
  amountMinor: number;
  /** Bibi's refund id: the same key never refunds twice. */
  idempotencyKey: string;
  /** Bibi ids (`paymentId`, `refundId`) for the provider's event to find the refund again. */
  metadata: Record<string, string>;
};

/** The provider's id of what a call created (a refund, a booked payment). */
export type ProviderReference = { providerReference: string };

/** Taking payments (ADR 0100). `onDemand`: attempts expire in minutes and start at the pay page. */
export type CollectPort = {
  methods: readonly PaymentMethodKey[];
  onDemand: boolean;
  startAttempt(input: StartAttemptInput): Promise<Result<AttemptRef>>;
  cancelAttempt(input: AttemptRefInput): Promise<Result<true>>;
  refund(input: RefundInput): Promise<Result<ProviderReference>>;
};

/** One frozen invoice line with the revenue account the export posts it to (ADR 0077). */
export type InvoiceSnapshotLine = {
  name: string;
  quantity: number;
  unitPriceMinor: number;
  discountPercent: number;
  vatRatePercent: number;
  /** VAT per rate; more than one for a bundle (ADR 0059). */
  vatRows: readonly { vatRatePercent: number; totalExclVatMinor: number }[];
  revenueAccount: string;
};

/** A paid deposit the invoice deducts, with its VAT split (ADR 0090, 0093). */
export type InvoiceSnapshotDeduction = {
  description: string;
  amountMinor: number;
  vatRows: unknown;
};

/** What a provider needs to raise an invoice: Bibi's frozen invoice (ADR 0052). */
export type InvoiceSnapshot = {
  invoiceDate: string;
  dueDate: string | null;
  currency: string;
  /** Bibi's own reference, shown on the invoice: `Order #<reference>, invoice #<number>`. */
  reference: string;
  customer: { name: string; email: string | null };
  lines: readonly InvoiceSnapshotLine[];
  deductions: readonly InvoiceSnapshotDeduction[];
  advancesAccount: string;
};

export type IssuedDocument = { providerReference: string; url: string | null };

/** A payment the provider booked on an invoice. `reference` is unique within the connection. */
export type ProviderPayment = { reference: string; amountMinor: number; paidAt: Date };

export type IssueInput = { auth: ProviderAuth; invoice: InvoiceSnapshot; idempotencyKey: string };

export type CreditInput = AttemptRefInput & {
  amountMinor: number;
  reason: string | null;
  /** Bibi's credit note id. */
  idempotencyKey: string;
};

export type RegisterPaymentInput = AttemptRefInput & { payment: ProviderPayment };

/** Raising invoices in the provider (ADR 0100). Every call runs after the commit (ADR 0058). */
export type InvoicingPort = {
  /** `idempotencyKey`: Bibi's invoice id, so a retried issue never raises it twice. */
  issue(input: IssueInput): Promise<Result<IssuedDocument>>;
  void(input: AttemptRefInput): Promise<Result<true>>;
  credit(input: CreditInput): Promise<Result<IssuedDocument>>;
  listPayments(input: AttemptRefInput): Promise<Result<ProviderPayment[]>>;
  /** Books a payment another provider took (card, Swish) on the provider's invoice. */
  registerPayment?(input: RegisterPaymentInput): Promise<Result<ProviderReference>>;
};

/** A verified inbound delivery: its event id and what it means for Bibi. */
export type VerifiedDelivery = { eventId: string; type: string; signals: ProviderSignal[] };

export type VerifyWebhookInput = { payload: string; headers: Headers; db?: Db };

/**
 * `verify` checks a signed delivery, or, for a provider whose callbacks are unsigned (Swish),
 * reads the state again from the provider and builds the signals from that (ADR 0100).
 */
export type WebhookPort = {
  isConfigured(): boolean;
  verify(input: VerifyWebhookInput): Result<VerifiedDelivery> | Promise<Result<VerifiedDelivery>>;
};

/** An open stream; the worker stops it on shutdown. */
export type StreamHandle = { stop(): void };
export type StreamCatchUpInput = { db?: Db };

/** A long-lived connection that pushes events (Fortnox Topics), run by the worker. */
export type StreamPort = {
  isConfigured(): boolean;
  /** How long the provider replays missed events; a longer gap needs a catch-up. */
  replayMs: number;
  /** Opens the one connection for every connected organization; it reconnects until stopped. */
  start(): StreamHandle;
  /** Re-reads what the stream missed when it was away longer than `replayMs` (worker start). */
  catchUp(input: StreamCatchUpInput): Promise<Result<PollOutcome>>;
};

export type PollRunInput = { db?: Db };
export type PollOutcome = { organizations: number; synced: number };

/** A scheduled pull for providers without push (ADR 0100); the worker calls `run` every interval. */
export type PollPort = {
  intervalMs: number;
  run(input: PollRunInput): Promise<Result<PollOutcome>>;
};

export type SignalsPort = { webhook?: WebhookPort; stream?: StreamPort; poll?: PollPort };

/**
 * A provider behind ports (ADR 0100): one folder in `providers/<key>/` registers it with the
 * capabilities it has. Core dispatches by key through the registry; nothing outside a provider
 * folder names a provider. `ledger`: the provider keeps the books for what it invoices.
 */
export type ProviderAdapter = {
  key: ProviderKey;
  ledger: boolean;
  isConfigured(): boolean;
  connect: ConnectPort;
  collect?: CollectPort;
  invoicing?: InvoicingPort;
  signals?: SignalsPort;
};
