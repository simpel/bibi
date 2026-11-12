import { createHash, randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { createMemoryProvider, type MemoryProvider } from "../../providers/memory/memory-adapter";
import type { ProviderKey } from "../../providers/provider-keys";
import { providersWith, setProviderAdapter } from "../../providers/registry";

/** The Swish connection form the memory fake accepts: the number is the account id. */
const SwishDemoCredentials = z.object({
  swishNumber: z.string().min(1),
  certificate: z.string().min(1).describe("The .p12, base64"),
  passphrase: z.string().min(1),
});

/**
 * What a demo organization enters as its Swish agreement (a fake; no certificate is read). The
 * number is derived from the organization, since a Swish number belongs to one organization.
 */
export function demoSwishCredentials({ organizationId }: { organizationId: string }) {
  const digits = createHash("sha256").update(organizationId).digest().readUInt32BE(0) % 10_000_000;
  return {
    swishNumber: `123${String(digits).padStart(7, "0")}`,
    certificate: "ZGVtbw==",
    passphrase: "demo",
  };
}

type Installed = ProviderKey[];

const fakes = new Map<ProviderKey, MemoryProvider>();

/** The in-memory provider installed for the run, whose state the seed reads and changes. */
export const demoFake = ({ key }: { key: ProviderKey }) => fakes.get(key) ?? null;

function install({ key, fake }: { key: ProviderKey; fake: MemoryProvider }) {
  fakes.set(key, fake);
  setProviderAdapter({ key, adapter: fake.adapter });
}

/**
 * Memory fakes for every provider, so the demo never calls one (ADR 0057, 0100): Stripe's account
 * is CONNECTED at once, Swish takes a Swish request, Fortnox and Visma issue and book invoices
 * (ledger providers; `state.payments` is what they report as paid).
 */
function installFakes(): Installed {
  const installed: Installed = [];
  for (const operator of providersWith({ capability: "HOSTED_ONBOARDING" })) {
    const fake = createMemoryProvider({
      key: operator.key,
      connectKind: "HOSTED_ONBOARDING",
      methods: operator.collect?.methods ?? [],
    });
    fake.accountStatus = "CONNECTED";
    install({ key: operator.key, fake });
    installed.push(operator.key);
  }
  const swish = createMemoryProvider({
    key: "SWISH",
    connectKind: "HOSTED_ONBOARDING",
    methods: ["SWISH"],
    onDemand: true,
  });
  swish.adapter.connect = {
    kind: "CREDENTIALS",
    credentialsSchema: SwishDemoCredentials,
    verify: async ({ credentials }) =>
      ok({ value: { externalAccountId: String(credentials.swishNumber) } }),
  };
  install({ key: "SWISH", fake: swish });
  installed.push("SWISH");
  for (const key of ["FORTNOX", "VISMA"] as const) {
    const ledger = createMemoryProvider({
      key,
      connectKind: "OAUTH",
      invoicing: true,
      ledger: true,
      // Both book card and Swish payments taken in Bibi (ADR 0100, 0106).
      registerPayment: true,
    });
    install({ key, fake: ledger });
    installed.push(key);
  }
  return installed;
}

/**
 * Runs `run` with every provider replaced by an in-memory one (no provider calls), then restores
 * the built-in adapters. Connections seal their secrets, so a run without `INTEGRATION_SECRET_KEY`
 * gets a throwaway one. Never used outside the seed.
 */
export async function withDemoPayments<T>({
  run,
}: {
  run: () => Promise<Result<T>>;
}): Promise<Result<T>> {
  const env = getEnv();
  const savedKey = env.INTEGRATION_SECRET_KEY;
  if (!savedKey) Object.assign(env, { INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64") });
  const installed = installFakes();
  try {
    return await run();
  } finally {
    for (const key of installed) setProviderAdapter({ key, adapter: undefined });
    fakes.clear();
    Object.assign(env, { INTEGRATION_SECRET_KEY: savedKey });
  }
}
