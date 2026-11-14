import { ok, type Result } from "../../errors/result";
import { completeIntegrationConnect } from "../../features/integration/complete-connect-operation";
import { connectIntegration } from "../../features/integration/connect-operation";
import { disconnectIntegration } from "../../features/integration/disconnect-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { isUsable } from "../../providers/connections";
import { ledgerProviderKeys } from "../../providers/registry";
import { demoSwishCredentials } from "./demo-payments";
import type { DemoProvider } from "./types";

type Ctx = { context: ExecuteContext };

/** Swish: the number and certificate are entered, then checked after the commit (ADR 0100). */
export async function connectDemoSwish({ context }: Ctx) {
  const input = { provider: "SWISH" as const, credentials: demoSwishCredentials(context) };
  return execute({ operation: connectIntegration, input, context });
}

/** An OAuth provider: the consent page's state comes back as the callback would bring it. */
export async function connectDemoOauth({ context, provider }: Ctx & { provider: DemoProvider }) {
  const started = await execute({ operation: connectIntegration, input: { provider }, context });
  if (!started.ok) return started;
  const state = new URL(started.value.authorizeUrl ?? "").searchParams.get("state") ?? "";
  const callback = { ...context, credential: "session" as const };
  const input = { provider, code: `demo-${provider}`, state };
  return execute({ operation: completeIntegrationConnect, input, context: callback });
}

/**
 * The accounting system an invoice needs is the connected one (ADR 0108): when another is
 * connected it is disconnected first, as a venue that switches would, then this one connects.
 * Connecting moves the INVOICE route to it.
 */
export async function ensureDemoLedger({
  context,
  provider,
}: Ctx & { provider: DemoProvider }): Promise<Result<true>> {
  const rows = await context.db.providerConnection.findMany({
    where: { provider: { in: ledgerProviderKeys() } },
  });
  const live = rows.filter((row) => isUsable({ row }));
  if (live.some((row) => row.provider === provider)) return ok({ value: true });
  for (const row of live) {
    const input = { provider: row.provider };
    const off = await execute({ operation: disconnectIntegration, input, context });
    if (!off.ok) return off;
  }
  const connected = await connectDemoOauth({ context, provider });
  return connected.ok ? ok({ value: true }) : connected;
}
