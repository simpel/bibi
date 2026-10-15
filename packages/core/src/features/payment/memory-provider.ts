import { createId } from "@paralleldrive/cuid2";
import { ok } from "../../errors/result";
import type { CreateCheckoutInput, CreateInvoiceInput, PaymentProvider } from "./provider";

export type RecordedCharge =
  | ({ kind: "checkout" } & CreateCheckoutInput)
  | ({ kind: "invoice" } & CreateInvoiceInput);

export type MemoryPaymentProvider = PaymentProvider & {
  /** Every charge requested so far, in order. */
  charges: RecordedCharge[];
};

const HOUR = 60 * 60 * 1000;

/**
 * In-memory stand-in for tests (like `createMemoryMailProvider`). References are unique across
 * instances; a repeated idempotency key returns the first charge's reference, as Stripe does.
 */
export function createMemoryPaymentProvider(): MemoryPaymentProvider {
  const charges: RecordedCharge[] = [];
  const refs = new Map<string, string>();
  const refFor = ({ key, prefix }: { key: string; prefix: string }) => {
    const ref = refs.get(key) ?? `${prefix}_test_${createId()}`;
    refs.set(key, ref);
    return ref;
  };
  return {
    charges,
    createCheckout: async (input) => {
      if (!charges.some((c) => c.idempotencyKey === input.idempotencyKey)) {
        charges.push({ kind: "checkout", ...input });
      }
      const providerReference = refFor({ key: input.idempotencyKey, prefix: "cs" });
      return ok({
        value: {
          providerReference,
          url: `https://checkout.stripe.test/${providerReference}`,
          expiresAt: new Date(Date.now() + 24 * HOUR),
        },
      });
    },
    createInvoice: async (input) => {
      if (!charges.some((c) => c.idempotencyKey === input.idempotencyKey)) {
        charges.push({ kind: "invoice", ...input });
      }
      const providerReference = refFor({ key: input.idempotencyKey, prefix: "in" });
      return ok({
        value: { providerReference, url: `https://invoice.stripe.test/${providerReference}` },
      });
    },
  };
}
