import { createId } from "@paralleldrive/cuid2";
import { ok } from "../../errors/result";
import type { CollectPort, InvoicingPort, PaymentMethodKey } from "../types";
import type { MemoryState } from "./memory-state";

const HOUR = 60 * 60 * 1000;

type PortInput = { state: MemoryState };

/**
 * Attempts in memory. References are unique across instances; a repeated idempotency key returns
 * the first attempt's reference, as Stripe does.
 */
export function memoryCollect({
  state,
  methods,
}: PortInput & { methods: readonly PaymentMethodKey[] }): CollectPort {
  const refs = new Map<string, string>();
  const refFor = ({ key, prefix }: { key: string; prefix: string }) => {
    const ref = refs.get(key) ?? `${prefix}_test_${createId()}`;
    refs.set(key, ref);
    return ref;
  };
  return {
    methods,
    onDemand: false,
    async startAttempt({ auth, ...input }) {
      const kind = input.method === "CARD" ? "checkout" : "invoice";
      if (!state.charges.some((c) => c.idempotencyKey === input.idempotencyKey)) {
        state.charges.push({ kind, connectedAccountId: auth.externalAccountId, ...input });
      }
      const providerReference = refFor({
        key: input.idempotencyKey,
        prefix: kind === "checkout" ? "cs" : "in",
      });
      const host = kind === "checkout" ? "checkout" : "invoice";
      const url = `https://${host}.stripe.test/${providerReference}`;
      const expiresAt = kind === "checkout" ? new Date(Date.now() + 24 * HOUR) : null;
      return ok({ value: { providerReference, url, qrToken: null, expiresAt } });
    },
    cancelAttempt: async () => ok({ value: true }),
    refund: async () => ok({ value: { providerReference: `re_test_${createId()}` } }),
  };
}

/** Invoicing in memory: raised invoices are numbered 1, 2, ... */
export function memoryInvoicing({ state }: PortInput): InvoicingPort {
  return {
    async issue({ invoice }) {
      state.raised.push(invoice);
      return ok({ value: { providerReference: String(state.raised.length), url: null } });
    },
    void: async () => ok({ value: true }),
    credit: async ({ providerReference }) =>
      ok({ value: { providerReference: `credit-${providerReference}`, url: null } }),
    listPayments: async () => ok({ value: state.payments }),
  };
}
