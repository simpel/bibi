import {
  createMemoryProvider,
  type MemoryProvider,
  providersWith,
  setProviderAdapter,
} from "../src/index";

export type FakeGateway = MemoryProvider;

/**
 * Installs one in-memory payment operator (ADR 0100) in place of the hosted-onboarding provider:
 * Connect onboarding, card checkouts and invoices. `resetProviderAdapters` undoes it.
 */
export function installFakeGateway(): FakeGateway {
  const [operator] = providersWith({ capability: "HOSTED_ONBOARDING" });
  if (!operator) throw new Error("No hosted-onboarding provider is registered");
  const fake = createMemoryProvider({
    key: operator.key,
    connectKind: "HOSTED_ONBOARDING",
    methods: ["CARD", "INVOICE"],
    ...(operator.signals ? { signals: operator.signals } : {}),
  });
  setProviderAdapter({ key: operator.key, adapter: fake.adapter });
  return fake;
}
