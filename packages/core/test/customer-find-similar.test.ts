import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { namesMatch, normaliseCustomerName } from "../src/features/customer/customer-name";
import {
  createContact,
  createCustomer,
  createEntityType,
  type ExecuteContext,
  execute,
  findSimilarCustomers,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";

type Ctx = { context: ExecuteContext };
type Types = { customerType: string; contactType: string };

async function typesOf({ context }: Ctx): Promise<Types> {
  const make = async ({ base }: { base: "CUSTOMER" | "CONTACT" }) =>
    unwrap({
      result: await execute({ operation: createEntityType, input: { base, name: base }, context }),
    }).id;
  const customerType = await make({ base: "CUSTOMER" });
  return { customerType, contactType: await make({ base: "CONTACT" }) };
}

type CustomerInput = Ctx & { types: Types; name: string; email?: string };

async function customer({ context, types, name, email }: CustomerInput) {
  const input = { entityTypeId: types.customerType, name };
  const created = unwrap({ result: await execute({ operation: createCustomer, input, context }) });
  if (email) {
    const contact = { customerId: created.id, entityTypeId: types.contactType, name, email };
    unwrap({ result: await execute({ operation: createContact, input: contact, context }) });
  }
  return created;
}

type FindInput = Ctx & { name?: string; email?: string };

const find = async ({ context, ...input }: FindInput) =>
  unwrap({ result: await execute({ operation: findSimilarCustomers, input, context }) }).items.map(
    (item) => [item.customer.name, item.reasons] as const,
  );

describe("customer names compared for duplicates (ADR 0081)", () => {
  it("folds case and punctuation, keeps å ä ö and strips legal forms at either end", () => {
    expect(normaliseCustomerName({ name: "Volvo Cars AB" })).toBe("volvo cars");
    expect(normaliseCustomerName({ name: "AB Volvo" })).toBe("volvo");
    expect(normaliseCustomerName({ name: "Älvstrand-Tech, Ltd." })).toBe("älvstrand tech");
    expect(normaliseCustomerName({ name: "Konsum Väst ek. för." })).toBe("konsum väst");
    expect(normaliseCustomerName({ name: "AB" })).toBe("ab");
    expect(namesMatch({ a: "volvo cars", b: "volvo cars göteborg" })).toBe(true);
    expect(namesMatch({ a: "volvo", b: "volvocars" })).toBe(false);
    expect(namesMatch({ a: "ab", b: "ab x" })).toBe(false);
  });
});

describe("customer.findSimilar (ADR 0081)", () => {
  it("matches a normalised name and a shared company email domain", async () => {
    const context = testContext();
    const types = await typesOf({ context });
    await customer({ context, types, name: "Volvo Cars AB", email: "anna@volvocars.test" });
    await customer({ context, types, name: "Volvo Cars Göteborg" });
    await customer({ context, types, name: "Car Rental HB", email: "bo@VOLVOCARS.test" });
    await customer({ context, types, name: "Saab AB" });
    expect(await find({ context, name: "volvo cars", email: "new@volvocars.test" })).toEqual([
      ["Volvo Cars AB", ["NAME", "EMAIL_DOMAIN"]],
      ["Car Rental HB", ["EMAIL_DOMAIN"]],
      ["Volvo Cars Göteborg", ["NAME"]],
    ]);
  });

  it("ignores public mail domains and archived customers", async () => {
    const context = testContext();
    const types = await typesOf({ context });
    await customer({ context, types, name: "Private Person", email: "pp@gmail.com" });
    const old = await customer({ context, types, name: "Kvarnby Design AB", email: "x@kv.test" });
    // Archived directly, keeping its contact active: only the customer's status hides it.
    await getDb().customer.update({ where: { id: old.id }, data: { status: "ARCHIVED" } });
    expect(await find({ context, email: "someone@gmail.com" })).toEqual([]);
    expect(await find({ context, name: "Kvarnby Design", email: "y@kv.test" })).toEqual([]);
  });

  it("needs a name or an email and customer:read", async () => {
    const context = testContext();
    const empty = await execute({ operation: findSimilarCustomers, input: {}, context });
    expect(errorCode({ result: empty })).toBe("VALIDATION");
    const { organizationId } = context;
    const kitchen = testContext({ organizationId, permissions: { item: ["read"] } });
    const input = { name: "Volvo" };
    const forbidden = await execute({ operation: findSimilarCustomers, input, context: kitchen });
    expect(errorCode({ result: forbidden })).toBe("FORBIDDEN");
  });
});
