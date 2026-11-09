import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import type { HostedOnboardingPort, OauthConnectPort } from "./connect-types";
import { fortnoxAdapter } from "./fortnox/fortnox-adapter";
import { type PaymentMethodKey, PROVIDER_KEYS, type ProviderKey } from "./provider-keys";
import { stripeAdapter } from "./stripe/stripe-adapter";
import { swishAdapter } from "./swish/swish-adapter";
import type { ProviderAdapter } from "./types";
import { vismaAdapter } from "./visma/visma-adapter";

/** The adapters each provider folder registers (ADR 0100). */
const BUILT_IN: Record<ProviderKey, ProviderAdapter> = {
  STRIPE: stripeAdapter,
  FORTNOX: fortnoxAdapter,
  SWISH: swishAdapter,
  VISMA: vismaAdapter,
};

const overrides = new Map<ProviderKey, ProviderAdapter>();

export type ProviderKeyInput = { key: ProviderKey };

/** The adapter registered for a provider, or null when Bibi has none. */
export function findProvider({ key }: ProviderKeyInput): ProviderAdapter | null {
  return overrides.get(key) ?? BUILT_IN[key];
}

/** The adapter for a provider; UNAVAILABLE when Bibi has none. */
export function getProvider({ key }: ProviderKeyInput): Result<ProviderAdapter> {
  const adapter = findProvider({ key });
  if (adapter) return ok({ value: adapter });
  return err({ error: new AppError({ code: "UNAVAILABLE", message: `${key} is not available` }) });
}

/** Every registered adapter, in `PROVIDER_KEYS` order (the order routing falls back on). */
export function listProviders(): ProviderAdapter[] {
  return PROVIDER_KEYS.flatMap((key) => {
    const adapter = findProvider({ key });
    return adapter ? [adapter] : [];
  });
}

/** The providers that keep the books for what they invoice (ADR 0100): the SIE export skips them. */
export function ledgerProviderKeys(): ProviderKey[] {
  return listProviders().flatMap((adapter) => (adapter.ledger ? [adapter.key] : []));
}

export type Capability =
  | "collect"
  | "invoicing"
  | "webhook"
  | "stream"
  | "poll"
  | ProviderAdapter["connect"]["kind"];

function has({ adapter, capability }: { adapter: ProviderAdapter; capability: Capability }) {
  if (capability === "collect" || capability === "invoicing") return Boolean(adapter[capability]);
  if (capability === "webhook" || capability === "stream" || capability === "poll") {
    return Boolean(adapter.signals?.[capability]);
  }
  return adapter.connect.kind === capability;
}

/** The adapters with a capability: a port (`collect`, `invoicing`), a signal or a connect kind. */
export function providersWith({ capability }: { capability: Capability }): ProviderAdapter[] {
  return listProviders().filter((adapter) => has({ adapter, capability }));
}

export type TakesMethodInput = { adapter: ProviderAdapter; method: PaymentMethodKey };

/** Whether the provider can take a payment method: it collects it, or it raises invoices. */
export function takesMethod({ adapter, method }: TakesMethodInput): boolean {
  if (adapter.collect?.methods.includes(method)) return true;
  return method === "INVOICE" && Boolean(adapter.invoicing);
}

const notKind = ({ key, kind }: { key: ProviderKey; kind: string }) =>
  err({ error: new AppError({ code: "CONFLICT", message: `${key} does not connect by ${kind}` }) });

/** The provider's OAuth port; CONFLICT for a provider that connects another way. */
export function oauthPortOf({ key }: ProviderKeyInput): Result<OauthConnectPort> {
  const adapter = getProvider({ key });
  if (!adapter.ok) return adapter;
  const { connect } = adapter.value;
  return connect.kind === "OAUTH" ? ok({ value: connect }) : notKind({ key, kind: "OAuth" });
}

/** The provider's hosted onboarding port; CONFLICT for a provider that connects another way. */
export function onboardingPortOf({ key }: ProviderKeyInput): Result<HostedOnboardingPort> {
  const adapter = getProvider({ key });
  if (!adapter.ok) return adapter;
  const { connect } = adapter.value;
  return connect.kind === "HOSTED_ONBOARDING"
    ? ok({ value: connect })
    : notKind({ key, kind: "hosted onboarding" });
}

export type SetProviderAdapterInput = { key: ProviderKey; adapter: ProviderAdapter | undefined };

/** Tests swap in a fake (`createMemoryProvider`); `undefined` restores the built-in adapter. */
export function setProviderAdapter({ key, adapter }: SetProviderAdapterInput): void {
  if (adapter) overrides.set(key, adapter);
  else overrides.delete(key);
}

/** Restores every built-in adapter. */
export function resetProviderAdapters(): void {
  overrides.clear();
}
