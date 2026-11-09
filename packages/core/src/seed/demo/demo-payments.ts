import type { Result } from "../../errors/result";
import { createMemoryProvider } from "../../providers/memory/memory-adapter";
import { providersWith, setProviderAdapter } from "../../providers/registry";

/**
 * Runs `run` with every payment operator replaced by an in-memory one whose hosted account is
 * CONNECTED at once (no provider calls), so payments can be requested without real onboarding,
 * then restores the built-in adapters. Never used outside the seed.
 */
export async function withDemoPayments<T>({
  run,
}: {
  run: () => Promise<Result<T>>;
}): Promise<Result<T>> {
  const operators = providersWith({ capability: "HOSTED_ONBOARDING" });
  for (const operator of operators) {
    const fake = createMemoryProvider({
      key: operator.key,
      connectKind: "HOSTED_ONBOARDING",
      methods: operator.collect?.methods ?? [],
    });
    fake.accountStatus = "CONNECTED";
    setProviderAdapter({ key: operator.key, adapter: fake.adapter });
  }
  try {
    return await run();
  } finally {
    for (const operator of operators) setProviderAdapter({ key: operator.key, adapter: undefined });
  }
}
