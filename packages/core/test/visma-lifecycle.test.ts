import { describe, expect, it } from "vitest";
import {
  completeIntegrationConnect,
  connectIntegration,
  createInvoice,
  creditInvoice,
  type ExecuteContext,
  execute,
  findProvider,
  getAccessToken,
  recordManualPayment,
  sendInvoice,
  updatePaymentSettings,
} from "../src/index";
import { unwrap } from "./helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";
import { apiPath, stubVisma, tokenJson, useVismaEnv, vismaCompany } from "./visma-helpers";

useVismaEnv();

/** Connects Visma through `integration.connect` and the callback, with Visma's HTTP stubbed. */
async function connectVisma({ context }: { context: ExecuteContext }) {
  const session = { ...context, credential: "session" as const };
  const started = unwrap({
    result: await execute({
      operation: connectIntegration,
      input: { provider: "VISMA" },
      context: session,
    }),
  });
  const state = new URL(started.authorizeUrl ?? "").searchParams.get("state") ?? "";
  const input = { provider: "VISMA" as const, code: "code-1", state };
  return unwrap({
    result: await execute({ operation: completeIntegrationConnect, input, context: session }),
  });
}

describe("Visma through the core operations (ADR 0100)", () => {
  it("connects, raises the sent invoice and mirrors payments on each poll", async () => {
    const { context, order } = await moneySetup({ ledger: false });
    const stub = stubVisma();
    const company = vismaCompany({ stub });
    const connected = await connectVisma({ context });
    expect(connected).toMatchObject({
      provider: "VISMA",
      status: "CONNECTED",
      companyName: "Venue AB",
    });
    const routes = [{ method: "INVOICE" as const, provider: "VISMA" as const }];
    unwrap({
      result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
    });

    await makeInvoiceable({ context, statusId: order.statusId });
    const draft = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
    });
    const sent = unwrap({
      result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }),
    });
    expect(sent).toMatchObject({ provider: "VISMA" });
    const invoiceCall = stub.calls.find((c) => apiPath({ call: c }) === "/customerinvoices");
    expect(invoiceCall?.headers.Authorization).toBe("Bearer visma-access-1");

    const poll = findProvider({ key: "VISMA" })?.signals?.poll;
    company.invoice = { TotalAmount: 5600, RemainingAmount: 2600 };
    unwrap({ result: (await poll?.run({})) ?? { ok: false, error: new Error("no poll") } });
    const partly = await context.db.invoice.findUniqueOrThrow({ where: { id: draft.id } });
    const payments = await context.db.payment.findMany({
      where: { invoiceId: draft.id, status: "SUCCEEDED" },
    });
    expect(payments.map((p) => p.amountMinor)).toEqual([300_000]);
    expect(partly.status).toBe("SENT");

    company.invoice = { TotalAmount: 5600, RemainingAmount: 0 };
    unwrap({ result: (await poll?.run({})) ?? { ok: false, error: new Error("no poll") } });
    const settled = await context.db.payment.findMany({
      where: { invoiceId: draft.id, status: "SUCCEEDED" },
    });
    expect(settled.map((p) => p.amountMinor)).toEqual([560_000]);
  });

  it("does not read a credit note as a payment", async () => {
    const { context, order } = await moneySetup({ ledger: false });
    const stub = stubVisma();
    const company = vismaCompany({ stub });
    await connectVisma({ context });
    const routes = [{ method: "INVOICE" as const, provider: "VISMA" as const }];
    unwrap({
      result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
    });
    await makeInvoiceable({ context, statusId: order.statusId });
    const draft = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
    });
    unwrap({ result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }) });
    company.invoice = { TotalAmount: 5600, RemainingAmount: 5600 };
    const credit = { invoiceId: draft.id, amountMinor: 100_000 };
    unwrap({ result: await execute({ operation: creditInvoice, input: credit, context }) });
    const note = await context.db.creditNote.findFirstOrThrow({ where: { invoiceId: draft.id } });
    expect(note.status).toBe("ISSUED");

    // Visma lowers what is left to pay by the credit: no money arrived.
    const poll = findProvider({ key: "VISMA" })?.signals?.poll;
    company.invoice = { TotalAmount: 5600, RemainingAmount: 4600 };
    unwrap({ result: (await poll?.run({})) ?? { ok: false, error: new Error("no poll") } });
    const none = await context.db.payment.count({ where: { invoiceId: draft.id } });
    expect(none).toBe(0);
    company.invoice = { TotalAmount: 5600, RemainingAmount: 600 };
    unwrap({ result: (await poll?.run({})) ?? { ok: false, error: new Error("no poll") } });
    const paid = await context.db.payment.findMany({ where: { invoiceId: draft.id } });
    expect(paid.map((p) => p.amountMinor)).toEqual([400_000]);
  });

  it("registers a payment taken in Bibi there and does not count it again on the poll", async () => {
    const { context, order } = await moneySetup({ ledger: false });
    const stub = stubVisma();
    const company = vismaCompany({ stub });
    await connectVisma({ context });
    const routes = [{ method: "INVOICE" as const, provider: "VISMA" as const }];
    unwrap({
      result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
    });
    await makeInvoiceable({ context, statusId: order.statusId });
    const draft = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
    });
    unwrap({ result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }) });
    const input = { invoiceId: draft.id, amountMinor: 160_000, paidAt: new Date() };
    unwrap({ result: await execute({ operation: recordManualPayment, input, context }) });
    const registered = stub.calls.filter((c) => apiPath({ call: c }).endsWith("/payments"));
    expect(registered).toHaveLength(1);

    // Visma lowers what is left to pay by the registered payment: nothing new arrived.
    const poll = findProvider({ key: "VISMA" })?.signals?.poll;
    company.invoice = { TotalAmount: 5600, RemainingAmount: 4000 };
    unwrap({ result: (await poll?.run({})) ?? { ok: false, error: new Error("no poll") } });
    const only = await context.db.payment.findMany({ where: { invoiceId: draft.id } });
    expect(only.map((p) => p.method)).toEqual(["MANUAL"]);
    company.invoice = { TotalAmount: 5600, RemainingAmount: 0 };
    unwrap({ result: (await poll?.run({})) ?? { ok: false, error: new Error("no poll") } });
    const paid = await context.db.payment.findMany({
      where: { invoiceId: draft.id },
      orderBy: { createdAt: "asc" },
    });
    expect(paid.map((p) => [p.method, p.amountMinor])).toEqual([
      ["MANUAL", 160_000],
      ["INVOICE", 400_000],
    ]);
  });

  it("refreshes an expired access token through the shared lease before calling Visma", async () => {
    const { context } = await moneySetup({ ledger: false });
    const stub = stubVisma();
    vismaCompany({ stub });
    await connectVisma({ context });
    await context.db.providerConnection.updateMany({
      where: { provider: "VISMA" },
      data: { accessExpiresAt: new Date(Date.now() - 1000) },
    });
    const base = stub.route;
    stub.route = (call) =>
      call.url.endsWith("/connect/token") ? { json: tokenJson({ n: 2 }) } : base(call);
    const token = unwrap({ result: await getAccessToken({ context, provider: "VISMA" }) });
    expect(token).toBe("visma-access-2");
    const refresh = stub.calls.at(-1);
    expect(new URLSearchParams(refresh?.body).get("refresh_token")).toBe("visma-refresh-1");
  });
});
