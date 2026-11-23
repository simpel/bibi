import { describe, expect, it } from "vitest";
import {
  createCustomer,
  createEntityType,
  type ExecuteContext,
  execute,
  updateCustomer,
  updateEntityType,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";

type TypeInput = { context: ExecuteContext; buyerKind?: "BUSINESS" | "PRIVATE" };

const customerType = async ({ context, buyerKind }: TypeInput) =>
  unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "CUSTOMER", name: `Type ${buyerKind ?? "default"}`, buyerKind },
      context,
    }),
  });

describe("customer types carry business or private (ADR 0106)", () => {
  it("makes a customer type BUSINESS by default and refuses the kind on other bases", async () => {
    const context = testContext();
    expect((await customerType({ context })).buyerKind).toBe("BUSINESS");
    const input = { base: "ITEM" as const, name: "Room", buyerKind: "PRIVATE" as const };
    const refused = await execute({ operation: createEntityType, input, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("gives a new customer its type's kind and keeps only the number that fits", async () => {
    const context = testContext();
    const type = await customerType({ context, buyerKind: "PRIVATE" });
    const customer = unwrap({
      result: await execute({
        operation: createCustomer,
        input: {
          entityTypeId: type.id,
          name: "Ada",
          organizationNumber: "556677-8899",
          personalIdentityNumber: " 19900101-1234 ",
        },
        context,
      }),
    });
    expect(customer).toMatchObject({
      buyerKind: "PRIVATE",
      organizationNumber: null,
      personalIdentityNumber: "19900101-1234",
    });
    const business = unwrap({
      result: await execute({
        operation: updateCustomer,
        input: { id: customer.id, buyerKind: "BUSINESS" },
        context,
      }),
    });
    expect(business.personalIdentityNumber).toBeNull();
  });

  it("leaves existing customers alone when the type's kind changes", async () => {
    const context = testContext();
    const type = await customerType({ context });
    const input = { entityTypeId: type.id, name: "Acme" };
    const customer = unwrap({
      result: await execute({ operation: createCustomer, input, context }),
    });
    const changed = { id: type.id, buyerKind: "PRIVATE" as const };
    unwrap({ result: await execute({ operation: updateEntityType, input: changed, context }) });
    const again = unwrap({
      result: await execute({
        operation: updateCustomer,
        input: { id: customer.id, name: "Acme AB" },
        context,
      }),
    });
    expect(again.buyerKind).toBe("BUSINESS");
  });
});
