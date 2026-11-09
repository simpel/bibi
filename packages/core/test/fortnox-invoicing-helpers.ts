import { completeIntegrationConnect, type ExecuteContext, execute } from "../src/index";
import { unwrap } from "./helpers";
import {
  type FakeFortnox,
  installFakeFortnox,
  lastFakeFortnox,
  startFortnox,
} from "./integration-helpers";

/**
 * The in-memory Fortnox's invoicing (ADR 0100): raised invoices are numbered 1, 2, ... and
 * `payments` is what it lists as booked. Uses the fake `connectFortnox` installed.
 */
export function installFakeInvoicing(): FakeFortnox {
  return lastFakeFortnox() ?? installFakeFortnox();
}

/** Connects Fortnox through the real operations with Fortnox faked (ADR 0087). */
export async function connectFortnox({ context }: { context: ExecuteContext }) {
  installFakeFortnox();
  const session = { ...context, credential: "session" as const };
  const { state } = await startFortnox({ context: session });
  const input = { provider: "FORTNOX" as const, code: "code", state };
  unwrap({
    result: await execute({ operation: completeIntegrationConnect, input, context: session }),
  });
}
