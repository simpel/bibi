import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
  findInvitationByCode,
  getAuth,
  joinOffer,
  loadJoinableOrganizations,
  setPrimaryOrganization,
} from "../src/index";
import { signInByLink } from "../src/testing/sign-in-by-link";
import { createOrg } from "./helpers";

/** Signs up with `email` by magic link (verified), optionally marking the address unverified. */
const signUpAt = async ({ email, verified }: { email: string; verified: boolean }) => {
  const { userId, headers } = await signInByLink({ email, name: "Test User" });
  if (!verified)
    await getDb().user.update({ where: { id: userId }, data: { emailVerified: false } });
  return { userId, email, headers };
};

const signInAt = async ({ email }: { email: string }) => (await signInByLink({ email })).headers;

const activeOrganization = async ({ headers }: { headers: Headers }) =>
  (await getAuth().api.getSession({ headers }))?.session.activeOrganizationId ?? null;

const venueDomain = () => `venue-${createId().slice(0, 8)}.test`;

describe("domain offers (ADR 0078)", () => {
  it("claims the creator's domain and offers it, joining only on Join", async () => {
    const domain = venueDomain();
    const creator = await signUpAt({ email: `admin@${domain}`, verified: true });
    const organizationId = await createOrg({ headers: creator.headers });
    const profile = await getDb().organizationProfile.findUnique({ where: { organizationId } });
    expect(profile).toMatchObject({ emailDomain: domain, domainJoin: true });

    const colleague = await signUpAt({ email: `colleague@${domain}`, verified: true });
    expect(await activeOrganization({ headers: colleague.headers })).toBeNull();
    const before = await loadJoinableOrganizations(colleague);
    expect(before.offers.map((offer) => offer.organizationId)).toEqual([organizationId]);

    expect(await joinOffer({ userId: colleague.userId, organizationId })).toBe("joined");
    const after = await loadJoinableOrganizations(colleague);
    expect(after.offers).toEqual([]);
    expect(after.memberships).toMatchObject([{ organizationId, primary: false }]);
  });

  it("offers nothing to an unverified address, when turned off, or for an unverified creator", async () => {
    const domain = venueDomain();
    const creator = await signUpAt({ email: `admin@${domain}`, verified: true });
    const organizationId = await createOrg({ headers: creator.headers });
    const unverified = await signUpAt({ email: `new@${domain}`, verified: false });
    expect((await loadJoinableOrganizations(unverified)).offers).toEqual([]);
    expect(await joinOffer({ userId: unverified.userId, organizationId })).toBe("refused");

    await getDb().organizationProfile.update({
      where: { organizationId },
      data: { domainJoin: false },
    });
    const late = await signUpAt({ email: `late@${domain}`, verified: true });
    expect((await loadJoinableOrganizations(late)).offers).toEqual([]);

    const other = await signUpAt({ email: `admin@${venueDomain()}`, verified: false });
    const otherOrg = await createOrg({ headers: other.headers });
    const otherProfile = await getDb().organizationProfile.findUnique({
      where: { organizationId: otherOrg },
    });
    expect(otherProfile?.emailDomain).toBeNull();
  });
});

describe("primary organization (ADR 0078)", () => {
  it("starts new sessions in the primary organization", async () => {
    const user = await signUpAt({ email: `p-${createId()}@${venueDomain()}`, verified: true });
    const first = await createOrg({ headers: user.headers });
    const second = await createOrg({ headers: user.headers });
    expect(await activeOrganization({ headers: await signInAt(user) })).toBe(first);
    expect(await setPrimaryOrganization({ userId: user.userId, organizationId: second })).toBe(
      true,
    );
    expect(await activeOrganization({ headers: await signInAt(user) })).toBe(second);
    expect(await setPrimaryOrganization({ userId: user.userId, organizationId: "nope" })).toBe(
      false,
    );
  });
});

describe("invite codes (ADR 0078)", () => {
  it("finds a pending invitation by its code only for the invited email", async () => {
    const admin = await signUpAt({ email: `admin@${venueDomain()}`, verified: true });
    const organizationId = await createOrg({ headers: admin.headers });
    const email = `invitee-${createId()}@example.test`;
    const id = createId();
    await getDb().invitation.create({
      data: {
        ...{
          id,
          organizationId,
          email,
          role: "manager",
          code: `C${createId().slice(0, 7)}`.toUpperCase(),
        },
        expiresAt: new Date(Date.now() + 86_400_000),
        inviterId: admin.userId,
      },
    });
    const { code } = await getDb().invitation.findUniqueOrThrow({ where: { id } });
    if (!code) throw new Error("no code");
    expect(
      await findInvitationByCode({ code: code.toLowerCase(), email: email.toUpperCase() }),
    ).toBe(id);
    expect(await findInvitationByCode({ code, email: `someone-else@example.test` })).toBeNull();
  });
});
