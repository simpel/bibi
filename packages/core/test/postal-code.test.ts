import { describe, expect, it } from "vitest";
import {
  CustomerCreateInputSchema,
  CustomerUpdateInputSchema,
} from "../src/features/customer/schema";
import { OrganizationProfileUpdateInputSchema } from "../src/features/organization-profile/schema";
import { VenueCreateInputSchema, VenueUpdateInputSchema } from "../src/features/venue/schema";
import { isValidPostalCode } from "../src/shared/postal-code";

describe("isValidPostalCode", () => {
  it("accepts Swedish codes with or without the space", () => {
    expect(isValidPostalCode({ postalCode: "412 50", country: "SE" })).toBe(true);
    expect(isValidPostalCode({ postalCode: "41250", country: "se" })).toBe(true);
  });

  it("rejects codes in the wrong format for the country", () => {
    expect(isValidPostalCode({ postalCode: "4125", country: "SE" })).toBe(false);
    expect(isValidPostalCode({ postalCode: "abc12", country: "SE" })).toBe(false);
    expect(isValidPostalCode({ postalCode: "41250", country: "NO" })).toBe(false);
  });

  it("uses a generic rule for countries without a known format", () => {
    expect(isValidPostalCode({ postalCode: "1010", country: "AT" })).toBe(true);
    expect(isValidPostalCode({ postalCode: "hello", country: "AT" })).toBe(false);
    expect(isValidPostalCode({ postalCode: "12345" })).toBe(true);
  });
});

describe("OrganizationProfileUpdateInputSchema postal code", () => {
  it("flags an invalid code on postalCode with a localizable key", () => {
    const result = OrganizationProfileUpdateInputSchema.safeParse({
      postalCode: "123",
      country: "SE",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["postalCode"],
      params: { key: "invalidPostalCode" },
    });
  });

  it("accepts a valid or cleared code", () => {
    expect(
      OrganizationProfileUpdateInputSchema.safeParse({ postalCode: "412 50", country: "SE" })
        .success,
    ).toBe(true);
    expect(OrganizationProfileUpdateInputSchema.safeParse({ postalCode: null }).success).toBe(true);
  });
});

describe("venue inputs postal code", () => {
  it("checks the code on create and update", () => {
    const bad = { postalCode: "41", country: "SE" };
    expect(VenueCreateInputSchema.safeParse({ name: "Hall", ...bad }).success).toBe(false);
    expect(VenueUpdateInputSchema.safeParse({ id: "v1", ...bad }).success).toBe(false);
    expect(
      VenueCreateInputSchema.safeParse({ name: "Hall", postalCode: "417 56", country: "SE" })
        .success,
    ).toBe(true);
    expect(VenueUpdateInputSchema.safeParse({ id: "v1", name: "Hall" }).success).toBe(true);
  });
});

describe("customer inputs invoice postal code", () => {
  it("flags the invoice postal code against the invoice country", () => {
    const create = CustomerCreateInputSchema.safeParse({
      entityTypeId: "t1",
      name: "Acme",
      invoicePostalCode: "123",
      invoiceCountry: "SE",
    });
    expect(create.error?.issues[0]).toMatchObject({
      path: ["invoicePostalCode"],
      params: { key: "invalidPostalCode" },
    });
    const update = CustomerUpdateInputSchema.safeParse({ id: "c1", invoicePostalCode: "412 50" });
    expect(update.success).toBe(true);
  });
});
