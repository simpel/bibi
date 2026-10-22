import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { getAuth } from "../src/get-auth";
import { checkOrganizationSlug } from "../src/organization/check-slug";
import { signUp } from "./helpers";

const db = () => getDb();

describe("organization slug (ADR 0062)", () => {
  it("is free when nobody has it", async () => {
    const slug = `free-${createId().slice(0, 10)}`;
    expect(await checkOrganizationSlug({ db: db(), slug })).toEqual({
      slug,
      status: "free",
      suggestion: null,
    });
  });

  it("suggests the first free -n when the slug is taken", async () => {
    const { headers } = await signUp();
    const slug = `str-${createId().slice(0, 10)}`;
    await getAuth().api.createOrganization({ headers, body: { name: slug, slug } });
    await getAuth().api.createOrganization({ headers, body: { name: slug, slug: `${slug}-2` } });
    const check = await checkOrganizationSlug({ db: db(), slug });
    expect(check).toEqual({ slug, status: "taken", suggestion: `${slug}-3` });
  });

  it("refuses reserved and malformed slugs", async () => {
    expect(await checkOrganizationSlug({ db: db(), slug: "admin" })).toMatchObject({
      status: "reserved",
      suggestion: "admin-2",
    });
    for (const slug of ["ab", "-abc", "abc-", "Åre", "a_b_c"]) {
      expect((await checkOrganizationSlug({ db: db(), slug })).status).toBe("invalid");
    }
  });

  it("stops Better Auth from creating an organization with a reserved slug", async () => {
    const { headers } = await signUp();
    const create = getAuth().api.createOrganization({
      headers,
      body: { name: "Welcome", slug: "welcome" },
    });
    await expect(create).rejects.toThrow();
  });
});
