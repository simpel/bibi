import { describe, expect, it } from "vitest";
import {
  execute,
  getOrganizationProfile,
  provisionOrganization,
  setOrganizationSetupStatus,
  updateOrganizationProfile,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";

type Context = ReturnType<typeof testContext>;

const read = async ({ context }: { context: Context }) =>
  unwrap({ result: await execute({ operation: getOrganizationProfile, input: {}, context }) });

describe("organization profile (ADR 0061)", () => {
  it("reads defaults without creating a row, and provisioning creates it PENDING", async () => {
    const admin = testContext();
    expect(await read({ context: admin })).toMatchObject({ id: null, setupStatus: "PENDING" });
    expect(await admin.db.organizationProfile.count()).toBe(0);
    const { organizationId } = admin;
    unwrap({ result: await provisionOrganization({ organizationId, pipeline: "none" }) });
    const created = await read({ context: admin });
    expect(created.id).not.toBeNull();
    expect(created).toMatchObject({ setupStatus: "PENDING", country: "SE" });
  });

  it("lets an admin change the details and keeps omitted fields", async () => {
    const admin = testContext();
    const input = { legalName: "Venue AB", website: "https://venue.example", country: "no" };
    unwrap({
      result: await execute({ operation: updateOrganizationProfile, input, context: admin }),
    });
    const city = { city: "Göteborg", website: null };
    const after = unwrap({
      result: await execute({ operation: updateOrganizationProfile, input: city, context: admin }),
    });
    expect(after).toMatchObject({ legalName: "Venue AB", country: "NO", city: "Göteborg" });
    expect(after.website).toBeNull();
    const bad = { contactPhone: "phone", website: "not a url" };
    const refused = await execute({
      operation: updateOrganizationProfile,
      input: bad,
      context: admin,
    });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("needs configuration:write to change details and pipeline:write for the setup status", async () => {
    const admin = testContext();
    const member = peer({ of: admin, access: "read" });
    const manager = peer({ of: admin, access: "write" });
    const input = { legalName: "Not allowed AB" };
    const change = await execute({ operation: updateOrganizationProfile, input, context: manager });
    expect(errorCode({ result: change })).toBe("FORBIDDEN");
    const skip = { setupStatus: "SKIPPED" } as const;
    const byMember = await execute({
      operation: setOrganizationSetupStatus,
      input: skip,
      context: member,
    });
    expect(errorCode({ result: byMember })).toBe("FORBIDDEN");
    unwrap({
      result: await execute({ operation: setOrganizationSetupStatus, input: skip, context: admin }),
    });
    expect((await read({ context: member })).setupStatus).toBe("SKIPPED");
  });

  it("keeps organizations apart", async () => {
    const a = testContext();
    const input = { setupStatus: "COMPLETED" } as const;
    unwrap({ result: await execute({ operation: setOrganizationSetupStatus, input, context: a }) });
    expect(await read({ context: testContext() })).toMatchObject({
      id: null,
      setupStatus: "PENDING",
    });
  });
});
