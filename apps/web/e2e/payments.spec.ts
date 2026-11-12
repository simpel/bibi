import { expect, test } from "@playwright/test";
import { gotoApp } from "./goto-app";
import { call, cardPayment, connectProviders, payAtStripe, pricedOrder } from "./payment-fixtures";
import { signUpWithOrganization } from "./steps";

// Payments end to end (ADR 0100) against the in-memory Stripe and Swish the web server runs with
// under E2E_MEMORY_PROVIDERS: no provider is ever called. Data comes from REST calls in a fresh
// organization, as in the other specs.

test("the pay page offers card and Swish: card goes to checkout, Swish shows a QR code", async ({
  page,
}) => {
  await signUpWithOrganization({ page, name: "Pay page AB" });
  await connectProviders({ page });
  const order = await pricedOrder({ page });
  const payment = await cardPayment({ page, orderId: order.id });
  const checkout = new URL(String(payment.paymentUrl));
  expect(checkout.origin).toBe("https://checkout.stripe.test");
  const payPage = checkout.searchParams.get("back") ?? "";
  expect(payPage).toMatch(/\/pay\/[^/]+$/);
  await page.route("https://checkout.stripe.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Test checkout</h1>" }),
  );

  await page.goto(payPage);
  await expect(page.getByRole("button", { name: "Betala med Kort" })).toBeVisible();
  await page.getByRole("button", { name: "Betala med Kort" }).click();
  await expect(page).toHaveURL(
    new RegExp(`^https://checkout\\.stripe\\.test/${payment.providerReference}`),
  );

  await page.goto(payPage);
  await page.getByRole("button", { name: "Betala med Swish" }).click();
  await expect(page.getByRole("img", { name: "Skanna QR-koden med Swish-appen." })).toBeVisible();
});

test("staff refund a card payment and credit an invoice from the order page", async ({ page }) => {
  await signUpWithOrganization({ page, name: "Refund AB" });
  const accountId = await connectProviders({ page });
  const order = await pricedOrder({ page });
  const payment = await cardPayment({ page, orderId: order.id });
  await payAtStripe({ page, accountId, reference: String(payment.providerReference) });
  const invoice = await call({
    page,
    method: "post",
    path: "/invoices",
    data: { orderId: order.id },
  });
  await call({ page, method: "post", path: `/invoices/${invoice.id}/send`, data: {} });

  await gotoApp({ page, path: `/orders/${order.id}` });
  const paid = page.locator('[data-slot="payment-entry"]').first();
  await paid.getByRole("button", { name: "Återbetala" }).click();
  const refundDialog = page.getByRole("dialog");
  await refundDialog.getByLabel("Belopp (kr)").fill("200");
  await refundDialog.getByRole("button", { name: "Återbetala" }).click();
  await expect(page.getByText("Återbetalningen har startats.")).toBeVisible();
  const refunds = await call({ page, method: "get", path: `/payments/${payment.id}` });
  expect(refunds.refunds).toEqual([expect.objectContaining({ amountMinor: 20_000 })]);

  const invoiceRow = page.locator('[data-slot="invoice-entry"]').first();
  await invoiceRow.getByRole("button", { name: "Kreditera" }).click();
  const creditDialog = page.getByRole("dialog");
  await creditDialog.getByRole("button", { name: "Skapa kreditfaktura" }).click();
  await expect(page.getByText("Kreditfakturan har skapats.")).toBeVisible();
  await expect(invoiceRow.getByText(/krediterat/)).toBeVisible();
  const notes = await call({ page, method: "get", path: `/credit-notes?invoiceId=${invoice.id}` });
  // The accounting system numbers the credit note; Bibi does not (ADR 0106).
  expect(notes.items).toEqual([
    expect.objectContaining({ status: "ISSUED", documentNumber: expect.any(String) }),
  ]);
});
