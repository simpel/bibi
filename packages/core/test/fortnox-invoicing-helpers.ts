import {
  completeIntegrationConnect,
  type ExecuteContext,
  execute,
  type FortnoxInvoiceInput,
  type FortnoxPayment,
  ok,
  setFortnoxInvoicingGateway,
} from "../src/index";
import { unwrap } from "./helpers";
import { installFakeFortnox, startFortnox } from "./integration-helpers";

export type FakeInvoicing = { raised: FortnoxInvoiceInput[]; payments: FortnoxPayment[] };

/** An in-memory Fortnox invoicing API that numbers raised invoices 1, 2, ... */
export function installFakeInvoicing(): FakeInvoicing {
  const fake: FakeInvoicing = { raised: [], payments: [] };
  setFortnoxInvoicingGateway({
    gateway: {
      findOrCreateCustomer: async () => ok({ value: "C-1" }),
      raiseInvoice: async ({ accessToken: _token, email: _email, ...invoice }) => {
        fake.raised.push(invoice);
        return ok({ value: String(fake.raised.length) });
      },
      listPayments: async () => ok({ value: fake.payments }),
    },
  });
  return fake;
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
