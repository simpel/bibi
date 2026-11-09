import type { ExternalCompany, HostedAccountStatus } from "../connect-types";
import type { InvoiceSnapshot, ProviderPayment, StartAttemptInput } from "../types";

/** An attempt the fake was asked for: a card checkout or an invoice, as Stripe would make it. */
export type RecordedCharge = Omit<StartAttemptInput, "auth"> & {
  kind: "checkout" | "swish";
  connectedAccountId: string | null;
};

/** What a memory provider remembers and how it answers; tests read and change it. */
export type MemoryState = {
  /** Every connect call, as `name` or `name:<argument>` (`exchangeCode:code-1`, `refresh:refresh-1`). */
  calls: string[];
  /** Hosted onboarding: the status the account reports (`ACTIVE` reads as CONNECTED). */
  accountStatus: HostedAccountStatus | "ACTIVE";
  /** OAuth: the next refresh answer; tokens are numbered `access-<n>`, `refresh-<n>`. */
  refreshOutcome: "tokens" | "refused";
  issued: number;
  company: ExternalCompany;
  /** Attempts started, in order (`charges`) and invoices raised (`raised`). */
  charges: RecordedCharge[];
  raised: InvoiceSnapshot[];
  /** What `listPayments` answers for any invoice. */
  payments: ProviderPayment[];
  /** Port calls after the attempt (`refund:<ref>:<amount>`, `void:<ref>`, `credit:<ref>:<amount>`, `cancel:<ref>`, `register:<ref>:<amount>`). */
  portCalls: string[];
  /** When set, the next port call of that name fails with UNAVAILABLE (`refund`, `issue`, ...). */
  failing: Set<string>;
  /** When set, the next port call of that name is refused definitely (CONFLICT). */
  refusing: Set<string>;
  configured: boolean;
};

export const newMemoryState = (): MemoryState => ({
  calls: [],
  accountStatus: "ONBOARDING",
  refreshOutcome: "tokens",
  issued: 0,
  company: { name: "Lindholmen Konferens AB", organizationNumber: "556000-0000", tenantId: "123" },
  charges: [],
  raised: [],
  payments: [],
  portCalls: [],
  failing: new Set(),
  refusing: new Set(),
  configured: true,
});
