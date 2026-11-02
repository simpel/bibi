import { expect, type Page } from "@playwright/test";

type Created = Record<string, unknown> & { id: string };

/** A REST call as the signed-in user (session cookie); the created or listed JSON back. */
export async function rest({
  page,
  method,
  path,
  data,
}: {
  page: Page;
  method: "get" | "post";
  path: string;
  data?: object;
}) {
  const response = await page.request[method](`/api/v1${path}`, { data });
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBe(
    true,
  );
  return (await response.json()) as Created & { items: Created[] };
}

export const CUSTOMER = "Kvarnby Design AB";
export const CONTACT_EMAIL = "linnea.kvist@kvarnby.test";
export const PACKAGE = "Tasting package";
export const ITEM = "Coffee and tea";

type PageInput = { page: Page };

type TypeInput = { base: string; name: string; capabilities?: string[] };

async function createTypes({ page }: PageInput) {
  const type = ({ base, name, capabilities }: TypeInput) =>
    rest({ page, method: "post", path: "/entity-types", data: { base, name, capabilities } });
  const capabilities = ["BOOKABLE", "SETUPS"];
  const [customer, contact, ticket, line, room, dish] = [
    await type({ base: "CUSTOMER", name: "Company" }),
    await type({ base: "CONTACT", name: "Person" }),
    await type({ base: "TICKET", name: "Conference" }),
    await type({ base: "LINE", name: "Line" }),
    await type({ base: "ITEM", name: "Room", capabilities }),
    await type({ base: "ITEM", name: "Dish" }),
  ];
  return { customer, contact, ticket, line, room, dish };
}

/** A customer with one contact whose email domain is the customer's (what a message resolves). */
async function createCustomer({ page, types }: PageInput & { types: Types }) {
  const customer = await rest({
    page,
    method: "post",
    path: "/customers",
    data: { entityTypeId: types.customer.id, name: CUSTOMER },
  });
  const contactData = {
    ...{ customerId: customer.id, entityTypeId: types.contact.id },
    ...{ name: "Linnea Kvist", email: CONTACT_EMAIL },
  };
  await rest({ page, method: "post", path: "/contacts", data: contactData });
}

type Types = Awaited<ReturnType<typeof createTypes>>;

/** The package: a room line and a coffee line of 90 minutes, made for 8 to 20 guests. */
async function createPackage({ page, types }: PageInput & { types: Types }) {
  const setup = await rest({ page, method: "post", path: "/setups", data: { name: "Boardroom" } });
  const setups = [{ setupId: setup.id, capacity: 30 }];
  const roomData = { entityTypeId: types.room.id, name: "Linnea room", setups };
  const room = await rest({ page, method: "post", path: "/items", data: roomData });
  const food = { entityTypeId: types.dish.id, name: ITEM };
  const coffee = await rest({ page, method: "post", path: "/items", data: food });
  const statuses = await rest({ page, method: "get", path: "/ticket-statuses" });
  const entry = statuses.items.find((status) => status.entry === true);
  const base = { entityTypeId: types.line.id, offsetMinutes: 0, durationMinutes: 90 };
  const lines = [
    { ...base, name: "Tasting room", itemId: room.id, setupId: setup.id, quantity: 1 },
    { ...base, name: "Coffee and tea", itemId: coffee.id, quantity: null },
  ];
  const data = {
    ...{ name: PACKAGE, entityTypeId: types.ticket.id, statusId: entry?.id, lines },
    ...{ minGuests: 8, maxGuests: 20 },
  };
  await rest({ page, method: "post", path: "/ticket-templates", data });
}

/**
 * What the intake specs need in a fresh organization, made through REST: types, a customer with a
 * contact, a package with a guest range, and an item to add by hand. Returns the API endpoint's id
 * (for submitting an inbox message). The AI model is the scripted one (`E2E_MOCK_MODEL`).
 */
export async function setUpIntake({ page }: PageInput): Promise<{ endpointId: string }> {
  const types = await createTypes({ page });
  await createCustomer({ page, types });
  await createPackage({ page, types });
  const endpoints = await rest({ page, method: "get", path: "/inbound-endpoints" });
  const api = endpoints.items.find((endpoint) => endpoint.channel === "API");
  expect(api, "the organization has an API inbound endpoint").toBeDefined();
  return { endpointId: String(api?.id) };
}

/** An inbox message the way a partner system hands it in; the scripted model reads it. */
export async function submitRequest({ page, endpointId }: PageInput & { endpointId: string }) {
  const subject = "Wine tasting for 14 on 21 November";
  const text =
    "Hi! A wine tasting for 14 people on Friday 21 November, around 3 pm. Two of us are vegan.";
  const formFields = { name: "Linnea Kvist", company: CUSTOMER, email: CONTACT_EMAIL };
  const data = { endpointId, subject, text, formFields };
  const message = await rest({ page, method: "post", path: "/inbound-messages", data });
  return { subject, id: message.id };
}
