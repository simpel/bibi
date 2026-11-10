import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { setProcessProviderAdapter } from "../registry";
import { ProviderSignalSchema } from "../signal";
import type { CredentialsConnectPort, ProviderAdapter, WebhookPort } from "../types";
import { createMemoryProvider } from "./memory-adapter";

/** One test delivery: the signals as Bibi reads them, dates as ISO strings. */
const DeliverySchema = z.object({
  eventId: z.string().min(1),
  signals: z.array(
    ProviderSignalSchema.omit({ provider: true, eventId: true, occurredAt: true }).extend({
      occurredAt: z.coerce.date().optional(),
    }),
  ),
});

/** Unsigned JSON deliveries a browser test posts to `/api/providers/<key>/webhook`. */
const testWebhook = ({ key }: { key: ProviderAdapter["key"] }): WebhookPort => ({
  isConfigured: () => true,
  verify: ({ payload }) => {
    const parsed = DeliverySchema.safeParse(JSON.parse(payload || "{}"));
    if (!parsed.success) {
      return err({ error: new AppError({ code: "VALIDATION", message: "Not a test delivery" }) });
    }
    const { eventId, signals } = parsed.data;
    return ok({
      value: {
        eventId,
        type: "e2e",
        signals: signals.map((signal) => ({
          ...signal,
          provider: key,
          eventId,
          occurredAt: signal.occurredAt ?? new Date(),
        })),
      },
    });
  },
});

/** Credentials checked by nothing: the Swish number is the account id. */
const testCredentials: CredentialsConnectPort = {
  kind: "CREDENTIALS",
  credentialsSchema: z.object({ swishNumber: z.string().min(1) }),
  verify: async ({ credentials }) =>
    ok({ value: { externalAccountId: String(credentials.swishNumber) } }),
};

/**
 * Replaces Stripe and Swish with in-memory providers for browser tests (`E2E_MEMORY_PROVIDERS`,
 * never in production; the web app checks that before it calls this). Stripe connects at once
 * (hosted onboarding reports ACTIVE), takes cards and raises invoices; its checkout link carries
 * the pay page in `back`, as Stripe's own checkout links back to it. Swish connects with any
 * number and shows a QR code. Both accept unsigned test deliveries on their webhook.
 */
export function installE2eProviders(): void {
  const stripe = createMemoryProvider({
    key: "STRIPE",
    connectKind: "HOSTED_ONBOARDING",
    methods: ["CARD"],
    invoicing: true,
    signals: { webhook: testWebhook({ key: "STRIPE" }) },
  });
  stripe.accountStatus = "ACTIVE";
  const collect = stripe.adapter.collect;
  if (collect) {
    const start = collect.startAttempt;
    collect.startAttempt = async (input) => {
      const started = await start(input);
      if (!started.ok || !started.value.url) return started;
      const back = new URLSearchParams({ back: input.cancelUrl });
      return ok({ value: { ...started.value, url: `${started.value.url}?${back}` } });
    };
  }
  const swish = createMemoryProvider({
    key: "SWISH",
    connectKind: "HOSTED_ONBOARDING",
    methods: ["SWISH"],
    onDemand: true,
    signals: { webhook: testWebhook({ key: "SWISH" }) },
  });
  setProcessProviderAdapter({ key: "STRIPE", adapter: stripe.adapter });
  const swishAdapter = { ...swish.adapter, connect: testCredentials };
  setProcessProviderAdapter({ key: "SWISH", adapter: swishAdapter });
}
