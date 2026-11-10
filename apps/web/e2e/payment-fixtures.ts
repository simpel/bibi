import { expect, type Page } from "@playwright/test";

type Json = Record<string, unknown> & { id: string; items: Json[] };

type RestInput = { page: Page; method: "get" | "post" | "patch"; path: string; data?: object };

/** A REST call as the signed-in user (session cookie); the JSON back. */
export async function call({ page, method, path, data }: RestInput): Promise<Json> {
  const response = await page.request[method](`/api/v1${path}`, data ? { data } : {});
  const text = await response.text();
  expect(response.ok(), `${method} ${path}: ${response.status()} ${text}`).toBe(true);
  return JSON.parse(text) as Json;
}

type PageInput = { page: Page };

/**
 * Connects the in-memory Stripe and Swish the web server runs with under
 * `E2E_MEMORY_PROVIDERS` (`installE2eProviders`): Stripe by hosted onboarding (ACTIVE at once),
 * Swish with a number. Returns Stripe's account id, which test deliveries name.
 */
export async function connectProviders({ page }: PageInput): Promise<string> {
  await call({ page, method: "post", path: "/payment-account/onboarding", data: {} });
  await call({ page, method: "post", path: "/payment-account/sync", data: {} });
  const account = await call({ page, method: "get", path: "/payment-account" });
  // A Swish number belongs to one organization: a fresh one per run.
  const credentials = { swishNumber: `123${String(Date.now()).slice(-7)}` };
  await call({ page, method: "post", path: "/integrations/SWISH/connect", data: { credentials } });
  return String(account.stripeAccountId);
}

const type = ({ page, base, name, capabilities }: PageInput & TypeInput) =>
  call({ page, method: "post", path: "/entity-types", data: { base, name, capabilities } });

type TypeInput = { base: string; name: string; capabilities?: string[] };

/** An open, invoiceable order with one priced line of 2 × 250 kr (12 % VAT): 560 kr. */
export async function pricedOrder({ page }: PageInput) {
  const customerType = await type({ page, base: "CUSTOMER", name: "Company" });
  const contactType = await type({ page, base: "CONTACT", name: "Person" });
  const orderType = await type({ page, base: "ORDER", name: "Conference" });
  const lineType = await type({ page, base: "LINE", name: "Line" });
  const itemType = await type({ page, base: "ITEM", name: "Dish", capabilities: ["PRICED"] });
  const customer = await call({
    page,
    method: "post",
    path: "/customers",
    data: { entityTypeId: customerType.id, name: "Kvarnby Design AB" },
  });
  const contact = await call({
    page,
    method: "post",
    path: "/contacts",
    data: { entityTypeId: contactType.id, customerId: customer.id, name: "Linnea Kvist" },
  });
  const status = await call({
    page,
    method: "post",
    path: "/order-statuses",
    data: { name: "Ready to bill", color: "#22c55e" },
  });
  const flags = { entry: true, invoiceable: true };
  await call({ page, method: "patch", path: `/order-statuses/${status.id}`, data: flags });
  const order = await call({
    page,
    method: "post",
    path: "/orders",
    data: {
      entityTypeId: orderType.id,
      customerId: customer.id,
      contactId: contact.id,
      desiredStartsAt: "2037-11-03T08:00:00.000Z",
      desiredEndsAt: "2037-11-03T16:00:00.000Z",
      estimatedHeadcount: 12,
    },
  });
  const item = await call({
    page,
    method: "post",
    path: "/items",
    data: { entityTypeId: itemType.id, name: "Lunch", priceMinor: 25_000, vatRatePercent: 12 },
  });
  const line = { orderId: order.id, entityTypeId: lineType.id, itemId: item.id, quantity: 2 };
  await call({ page, method: "post", path: "/lines", data: { ...line, name: "Lunch" } });
  return order;
}

/** A SENT deposit request of 1 000 kr on the order and a card payment of 500 kr against it. */
export async function cardPayment({ page, orderId }: PageInput & { orderId: string }) {
  const deposit = await call({
    page,
    method: "post",
    path: "/deposits",
    data: { orderId, description: "Advance", amountMinor: 100_000 },
  });
  await call({ page, method: "post", path: `/deposits/${deposit.id}/send`, data: {} });
  return call({
    page,
    method: "post",
    path: "/payments",
    data: { depositId: deposit.id, amountMinor: 50_000 },
  });
}

/** What the in-memory Stripe's webhook takes: the payment's checkout paid. */
export async function payAtStripe({
  page,
  accountId,
  reference,
}: PageInput & { accountId: string; reference: string }) {
  const delivery = {
    eventId: `evt_e2e_${reference}`,
    signals: [{ kind: "attempt.succeeded", externalAccountId: accountId, reference }],
  };
  const response = await page.request.post("/api/providers/stripe/webhook", { data: delivery });
  expect(response.ok(), await response.text()).toBe(true);
}
