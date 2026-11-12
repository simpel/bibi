import { createId } from "@paralleldrive/cuid2";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { CollectPort, InvoicingPort, PaymentMethodKey } from "../types";
import type { MemoryState } from "./memory-state";

const HOUR = 60 * 60 * 1000;

type PortInput = { state: MemoryState };

/** Records a port call; UNAVAILABLE or CONFLICT (once) when the test made it fail or refuse. */
function call<T>({
  state,
  name,
  entry,
  value,
}: PortInput & { name: string; entry: string; value: T }): Result<T> {
  if (state.failing.delete(name)) {
    return err({ error: new AppError({ code: "UNAVAILABLE", message: `${name} failed` }) });
  }
  if (state.refusing.delete(name)) {
    return err({ error: new AppError({ code: "CONFLICT", message: `${name} refused` }) });
  }
  state.portCalls.push(entry);
  return ok({ value });
}

export type MemoryCollectInput = PortInput & {
  methods: readonly PaymentMethodKey[];
  onDemand: boolean;
};

/**
 * Attempts in memory. References are unique across instances; a repeated idempotency key returns
 * the first attempt's reference, as Stripe does. A SWISH attempt has a QR token, not a link.
 */
export function memoryCollect({ state, methods, onDemand }: MemoryCollectInput): CollectPort {
  const refs = new Map<string, string>();
  const refFor = ({ key, prefix }: { key: string; prefix: string }) => {
    const ref = refs.get(key) ?? `${prefix}_test_${createId()}`;
    refs.set(key, ref);
    return ref;
  };
  return {
    methods,
    onDemand,
    async startAttempt({ auth, ...input }) {
      if (state.failing.delete("startAttempt")) {
        return err({
          error: new AppError({ code: "UNAVAILABLE", message: "startAttempt failed" }),
        });
      }
      const kind = input.method === "SWISH" ? "swish" : "checkout";
      if (!state.charges.some((c) => c.idempotencyKey === input.idempotencyKey)) {
        state.charges.push({ kind, connectedAccountId: auth.externalAccountId, ...input });
      }
      const providerReference = refFor({
        key: input.idempotencyKey,
        prefix: kind === "swish" ? "sw" : "cs",
      });
      const swish = kind === "swish";
      const url = swish ? null : `https://checkout.stripe.test/${providerReference}`;
      const expiresAt = new Date(Date.now() + (swish ? HOUR / 20 : 24 * HOUR));
      return ok({
        value: {
          providerReference,
          url,
          qrToken: swish ? `qr-${providerReference}` : null,
          expiresAt,
        },
      });
    },
    cancelAttempt: async ({ providerReference }) =>
      call({
        state,
        name: "cancelAttempt",
        entry: `cancel:${providerReference}`,
        value: true as const,
      }),
    async refund({ providerReference, amountMinor, idempotencyKey }) {
      const done = call({
        state,
        name: "refund",
        entry: `refund:${providerReference}:${amountMinor}`,
        value: { providerReference: refFor({ key: idempotencyKey, prefix: "re" }) },
      });
      if (done.ok && !state.refunds.has(idempotencyKey)) {
        const entry = { providerReference: done.value.providerReference };
        state.refunds.set(idempotencyKey, { ...entry, status: state.refundOutcome });
      }
      return done;
    },
    async refundStatus({ idempotencyKey }) {
      if (state.failing.delete("refundStatus")) {
        return err({
          error: new AppError({ code: "UNAVAILABLE", message: "refundStatus failed" }),
        });
      }
      const found = state.refunds.get(idempotencyKey);
      if (!found) return ok({ value: { status: "MISSING" as const } });
      const { providerReference, status } = found;
      return ok({
        value:
          status === "PENDING"
            ? { status, providerReference }
            : { status, providerReference, occurredAt: new Date() },
      });
    },
  };
}

export type MemoryInvoicingInput = PortInput & { registerPayment: boolean };

/** Invoicing in memory: raised invoices are numbered 1, 2, ... */
export function memoryInvoicing({ state, registerPayment }: MemoryInvoicingInput): InvoicingPort {
  const port: InvoicingPort = {
    async issue({ invoice }) {
      if (state.failing.delete("issue")) {
        return err({ error: new AppError({ code: "UNAVAILABLE", message: "issue failed" }) });
      }
      state.raised.push(invoice);
      const providerReference = String(state.raised.length);
      return ok({
        value: { providerReference, url: `https://invoice.provider.test/${providerReference}` },
      });
    },
    void: async ({ providerReference }) =>
      call({ state, name: "void", entry: `void:${providerReference}`, value: true as const }),
    credit: async ({ providerReference, amountMinor }) => {
      const done = call({
        state,
        name: "credit",
        entry: `credit:${providerReference}:${amountMinor}`,
        value: { providerReference: `credit-${providerReference}-${createId()}`, url: null },
      });
      if (done.ok) state.credited.set(providerReference, done.value.providerReference);
      return done;
    },
    creditStatus: async ({ providerReference }) => {
      const credited = state.credited.get(providerReference);
      return ok({
        value: credited
          ? { status: "ISSUED" as const, providerReference: credited }
          : { status: "MISSING" as const },
      });
    },
    listPayments: async ({ providerReference }) =>
      ok({ value: [...state.payments, ...(state.paidOn.get(providerReference) ?? [])] }),
  };
  if (registerPayment) {
    port.registerPayment = async ({ providerReference, payment }) => {
      const reference = `reg-${createId()}`;
      const done = call({
        state,
        name: "registerPayment",
        entry: `register:${providerReference}:${payment.amountMinor}`,
        value: { providerReference: reference },
      });
      if (done.ok) {
        const booked = state.paidOn.get(providerReference) ?? [];
        state.paidOn.set(providerReference, [...booked, { ...payment, reference }]);
      }
      return done;
    };
  }
  return port;
}
