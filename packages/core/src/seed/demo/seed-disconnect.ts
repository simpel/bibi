import { ok, type Result } from "../../errors/result";
import { disconnectIntegration } from "../../features/integration/disconnect-operation";
import { disconnectPaymentAccount } from "../../features/payment-account/disconnect-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { withDemoPayments } from "./demo-payments";
import type { DemoOrg } from "./types";

type DisconnectInput = { context: ExecuteContext; org: DemoOrg };

/**
 * Last step of the money part: the demo's providers are memory fakes, so once the history is
 * seeded each connection is disconnected (rows stay, the history points at them). The page then
 * shows nothing as connected until an admin connects a real account. Inside `withDemoPayments`,
 * so a revoke never reaches a real provider.
 */
export async function disconnectDemoProviders({ context, org }: DisconnectInput) {
  if (!org.orders.some((order) => order.money)) return ok({ value: true as const });
  return withDemoPayments({
    run: async (): Promise<Result<true>> => {
      for (const provider of org.providers ?? []) {
        const input = { provider };
        const done = await execute({ operation: disconnectIntegration, input, context });
        if (!done.ok) return done;
      }
      const stripe = await execute({ operation: disconnectPaymentAccount, input: {}, context });
      return stripe.ok ? ok({ value: true }) : stripe;
    },
  });
}
