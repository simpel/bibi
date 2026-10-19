import { describe, expect, it } from "vitest";
import { resolveNames } from "../src/change-preview/resolve-names";
import { createTestCustomer } from "./customer-helpers";
import { testContext } from "./helpers";

describe("previewChange names (ADR 0050, feature scope)", () => {
  it("names only records whose feature the caller may view", async () => {
    const admin = testContext();
    const customer = await createTestCustomer({ context: admin, name: "Secret AB" });
    const ids = [customer.id];
    expect(await resolveNames({ context: admin, ids })).toEqual({ [customer.id]: "Secret AB" });
    const blind = { ...admin, permissions: { item: ["view" as const] } };
    expect(await resolveNames({ context: blind, ids })).toEqual({});
  });
});
