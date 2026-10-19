import { afterEach, describe, expect, it } from "vitest";
import { appError } from "../src/errors/app-error";
import { err } from "../src/errors/result";
import { createPayment, execute, setPaymentProvider, setStripeConnectGateway } from "../src/index";
import { runDryRun } from "../src/operations/run-dry-run";
import { runNested } from "../src/operations/run-nested";
import { errorCode } from "./helpers";
import { paymentSetup } from "./payment-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

const input = ({ depositId }: { depositId: string }) => ({
  depositId,
  method: "CARD" as const,
  amountMinor: 125_000,
  currency: "SEK",
});

describe("payment.create calls Stripe only after the commit (ADR 0058)", () => {
  it("makes no provider call when the handler runs in a rolled-back transaction", async () => {
    const { context, depositId, provider } = await paymentSetup();
    const dry = await runDryRun({ operation: createPayment, input: input({ depositId }), context });
    expect(dry.ok).toBe(true);
    expect(provider.charges).toEqual([]);
    expect(await context.db.payment.count()).toBe(0);
  });

  it("refuses to run nested, where the charge would run before the batch commits", async () => {
    const { context, depositId, provider } = await paymentSetup();
    const nested = await context.db.$transaction((tx) =>
      runNested({
        operation: createPayment,
        input: input({ depositId }),
        context: { ...context, db: tx, recordChange: () => undefined },
      }),
    );
    expect(errorCode({ result: nested })).toBe("INTERNAL");
    expect(provider.charges).toEqual([]);
  });

  it("keeps the row FAILED and audited when Stripe refuses the charge", async () => {
    const { context, depositId } = await paymentSetup();
    const refused = err({ error: appError({ code: "UNAVAILABLE", message: "Stripe is down" }) });
    setPaymentProvider({
      provider: { createCheckout: async () => refused, createInvoice: async () => refused },
    });
    const result = await execute({
      operation: createPayment,
      input: input({ depositId }),
      context,
    });
    expect(errorCode({ result })).toBe("UNAVAILABLE");
    const rows = await context.db.payment.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "FAILED", providerReference: null });
    const audit = await context.db.auditLog.findMany({ orderBy: { createdAt: "asc" } });
    const created = audit.filter((row) => row.operation === "payment.create");
    expect(created.map((row) => (row.after as { status?: string }).status)).toEqual([
      "PENDING",
      "FAILED",
    ]);
  });
});
