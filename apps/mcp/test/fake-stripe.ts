import {
  createMemoryProvider,
  type MemoryProvider,
  providersWith,
  setProviderAdapter,
} from "@bibi/core";

/**
 * Payment operator stand-in (ADR 0100): the account is created through the real operation, only
 * the provider is faked; it also takes card checkouts in memory.
 */
export function installFakeStripe({
  status = "ONBOARDING",
  onCreateAccount,
}: {
  status?: "ONBOARDING" | "ACTIVE";
  onCreateAccount?: () => void;
} = {}): MemoryProvider {
  const [operator] = providersWith({ capability: "HOSTED_ONBOARDING" });
  const key = operator?.key ?? "STRIPE";
  const fake = createMemoryProvider({
    key,
    connectKind: "HOSTED_ONBOARDING",
    methods: ["CARD"],
  });
  fake.accountStatus = status;
  const createAccount = fake.onboarding.createAccount;
  fake.onboarding.createAccount = async (input) => {
    onCreateAccount?.();
    return createAccount(input);
  };
  setProviderAdapter({ key, adapter: fake.adapter });
  return fake;
}
