import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { emailDomainOf } from "../src/organization/email-domain";
import { joinOrganizationByDomain } from "../src/organization/join-organization";
import { createUser, domain, orgWithAdmin, turn } from "./domain-join-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

describe("email domains (ADR 0078)", () => {
  it("lowercases work domains and refuses public and malformed ones", () => {
    expect(emailDomainOf({ email: "Anna@Venue.SE" })).toBe("venue.se");
    expect(emailDomainOf({ email: "anna@gmail.com" })).toBeNull();
    expect(emailDomainOf({ email: "anna@example.test" })).toBeNull();
    expect(emailDomainOf({ email: "anna" })).toBeNull();
  });
});

describe("organizationProfile.setDomainJoin (ADR 0078)", () => {
  it("claims the admin's own verified domain and keeps it when turned off", async () => {
    const own = domain();
    const context = await orgWithAdmin({ email: `admin@${own}` });
    const on = unwrap({ result: await turn({ context, enabled: true }) });
    expect(on).toMatchObject({ emailDomain: own, domainJoin: true });
    const off = unwrap({ result: await turn({ context, enabled: false }) });
    expect(off).toMatchObject({ emailDomain: own, domainJoin: false });
  });

  it("refuses to claim an unverified or public address", async () => {
    const unverified = await orgWithAdmin({ email: `admin@${domain()}`, verified: false });
    expect(errorCode({ result: await turn({ context: unverified, enabled: true }) })).toBe(
      "VALIDATION",
    );
    const publicMail = await orgWithAdmin({ email: `admin-${createId()}@gmail.com` });
    expect(errorCode({ result: await turn({ context: publicMail, enabled: true }) })).toBe(
      "VALIDATION",
    );
  });

  it("is admin only", async () => {
    const admin = await orgWithAdmin({ email: `admin@${domain()}` });
    const manager = testContext({ organizationId: admin.organizationId, access: "write" });
    expect(errorCode({ result: await turn({ context: manager, enabled: false }) })).toBe(
      "FORBIDDEN",
    );
  });
});

describe("joinOrganizationByDomain (ADR 0078)", () => {
  it("joins once as member, audited, and never again after a removal", async () => {
    const own = domain();
    const context = await orgWithAdmin({ email: `admin@${own}` });
    const email = `colleague@${own}`;
    const userId = await createUser({ email });
    const input = { organizationId: context.organizationId, userId, email };
    expect(await joinOrganizationByDomain(input)).toBe("joined");
    const member = await context.db.member.findFirst({ where: { userId } });
    expect(member?.role).toBe("member");
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "member.joinByDomain", entityId: member?.id },
    });
    expect(audit?.actorType).toBe("SYSTEM");
    expect(await joinOrganizationByDomain(input)).toBe("refused");
    await getDb().member.deleteMany({ where: { userId } });
    expect(await joinOrganizationByDomain(input)).toBe("refused");
  });

  it("leaves a pending invitation to decide the role", async () => {
    const own = domain();
    const context = await orgWithAdmin({ email: `admin@${own}` });
    const email = `invited@${own}`;
    const userId = await createUser({ email });
    const inviterId = context.actor.userId ?? "";
    await getDb().invitation.create({
      data: {
        id: createId(),
        organizationId: context.organizationId,
        email,
        role: "manager",
        expiresAt: new Date(Date.now() + 86_400_000),
        inviterId,
      },
    });
    const input = { organizationId: context.organizationId, userId, email };
    expect(await joinOrganizationByDomain(input)).toBe("refused");
  });
});
