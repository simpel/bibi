import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { newInvitationCode, normalizeInvitationCode } from "../src/features/member/invitation-code";
import { domainOffers, joinDomainOffer } from "../src/organization/join-by-domain";
import { createUser, domain, orgWithAdmin, turn } from "./domain-join-helpers";
import { unwrap } from "./helpers";
import { invite, withInviter } from "./invitation-helpers";

describe("domain offers (ADR 0078)", () => {
  it("offers a claimed organization until joined, and never again after a removal", async () => {
    const own = domain();
    const context = await orgWithAdmin({ email: `admin@${own}` });
    unwrap({ result: await turn({ context, enabled: true }) });
    const userId = await createUser({ email: `new@${own}` });
    const { organizationId } = context;
    expect((await domainOffers({ userId })).map((offer) => offer.organizationId)).toEqual([
      organizationId,
    ]);
    expect(await joinDomainOffer({ userId, organizationId })).toBe(true);
    expect(await domainOffers({ userId })).toEqual([]);
    await getDb().member.deleteMany({ where: { userId, organizationId } });
    expect(await domainOffers({ userId })).toEqual([]);
    expect(await joinDomainOffer({ userId, organizationId })).toBe(false);
  });

  it("never offers an organization that does not claim the domain", async () => {
    const context = await orgWithAdmin({ email: `admin@${domain()}` });
    unwrap({ result: await turn({ context, enabled: true }) });
    const userId = await createUser({ email: `someone@${domain()}` });
    const organizationId = context.organizationId;
    expect(await joinDomainOffer({ userId, organizationId })).toBe(false);
  });
});

describe("invite codes (ADR 0078)", () => {
  it("gives every invitation a readable code", async () => {
    const context = await withInviter();
    const email = `invitee-${createId()}@example.test`;
    const invitation = unwrap({ result: await invite({ context, email, role: "member" }) });
    expect(invitation.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(newInvitationCode()).not.toBe(newInvitationCode());
    expect(normalizeInvitationCode({ code: " k7m2-qx9p " })).toBe("K7M2QX9P");
  });
});
