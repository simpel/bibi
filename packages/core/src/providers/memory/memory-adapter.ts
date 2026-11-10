import type { ConnectKind, HostedOnboardingPort, OauthConnectPort } from "../connect-types";
import type { PaymentMethodKey, ProviderKey } from "../provider-keys";
import type { ProviderAdapter, SignalsPort } from "../types";
import { memoryOauth, memoryOnboarding } from "./memory-connect";
import { memoryCollect, memoryInvoicing } from "./memory-ports";
import { type MemoryState, newMemoryState } from "./memory-state";

export type * from "./memory-state";

export type CreateMemoryProviderInput = {
  key: ProviderKey;
  connectKind: Exclude<ConnectKind, "CREDENTIALS">;
  /** Methods it collects; none = no collect port. */
  methods?: readonly PaymentMethodKey[];
  /** Attempts start at the pay page (Swish), not at `payment.create`. */
  onDemand?: boolean;
  invoicing?: boolean;
  /** The invoicing port can book a payment another provider took. */
  registerPayment?: boolean;
  ledger?: boolean;
  signals?: SignalsPort;
};

/** The fake and its state; tests may replace a port's functions (e.g. `onboarding.createAccount`). */
export type MemoryProvider = MemoryState & {
  adapter: ProviderAdapter;
  onboarding: HostedOnboardingPort;
  oauth: OauthConnectPort;
};

/**
 * One in-memory provider with every capability (ADR 0100), for tests and the demo seed: install it
 * with `setProviderAdapter({ key, adapter: fake.adapter })`. No network call is ever made.
 */
export function createMemoryProvider({
  key,
  connectKind,
  methods = [],
  onDemand = false,
  invoicing = false,
  registerPayment = false,
  ledger = false,
  signals,
}: CreateMemoryProviderInput): MemoryProvider {
  const state = newMemoryState();
  const onboarding = memoryOnboarding({ state });
  const oauth = memoryOauth({ state });
  const fake = state as MemoryProvider;
  fake.onboarding = onboarding;
  fake.oauth = oauth;
  fake.adapter = {
    key,
    ledger,
    isConfigured: () => fake.configured,
    connect: connectKind === "OAUTH" ? oauth : onboarding,
    ...(methods.length > 0 ? { collect: memoryCollect({ state, methods, onDemand }) } : {}),
    ...(invoicing ? { invoicing: memoryInvoicing({ state, registerPayment }) } : {}),
    ...(signals ? { signals } : {}),
  };
  return fake;
}
