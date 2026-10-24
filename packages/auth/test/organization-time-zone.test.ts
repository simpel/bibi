import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { getAuth } from "../src/index";
import { signUp } from "./helpers";

const create = ({
  headers,
  metadata,
}: {
  headers: Headers;
  metadata?: Record<string, unknown>;
}) => {
  const slug = `tz-${createId().slice(0, 10)}`;
  return getAuth().api.createOrganization({ headers, body: { name: slug, slug, metadata } });
};

describe("time zone on organization create (ADR 0064 decision 3a)", () => {
  it("stores the chosen zone on the profile and clears the metadata that carried it", async () => {
    const { headers } = await signUp();
    const org = await create({ headers, metadata: { timeZone: "America/New_York", x: 1 } });
    if (!org) throw new Error("organization not created");
    const profile = await getDb().organizationProfile.findUnique({
      where: { organizationId: org.id },
    });
    expect(profile?.timeZone).toBe("America/New_York");
    expect(profile?.setupStatus).toBe("PENDING");
    const row = await getDb().organization.findUnique({ where: { id: org.id } });
    expect(row?.metadata).toBeNull();
  });

  it("refuses a missing or unknown zone before anything is written", async () => {
    const { headers } = await signUp();
    await expect(create({ headers })).rejects.toThrow();
    await expect(create({ headers, metadata: { timeZone: "Mars/Olympus" } })).rejects.toThrow();
    await expect(create({ headers, metadata: { timeZone: "+01:00" } })).rejects.toThrow();
  });
});
