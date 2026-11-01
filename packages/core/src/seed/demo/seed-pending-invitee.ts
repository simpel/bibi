import type { Db } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { newInvitationCode } from "../../features/member/invitation-code";
import { domainOffers } from "../../organization/join-by-domain";
import { ADMIN_ROLE } from "../../permissions/fixed-roles";
import type { DemoOrg } from "./types";
import { demoEmail } from "./users";

/**
 * Nora Vik has a Lindholmen address but belongs nowhere yet, and Vingaleden has invited her
 * (ADR 0078). Signing in as her walks the whole welcome flow: the Lindholmen domain offer, then
 * her invite code for Vingaleden, then the list and the primary organization.
 */
export const PENDING_INVITEE = {
  name: "Nora Vik",
  domainOf: "lindholmen-demo",
  invitedTo: "vingaleden-demo",
  role: "manager",
};

/** Long enough that a dev database seeded today still has the invitation next month. */
const DEMO_INVITATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Seeded = { org: DemoOrg; organizationId: string };

const fail = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "INTERNAL", message: `Demo checks failed: ${message}` }) });

/**
 * The user and the invitation are Better Auth's rows, written as its sign-up and `member.invite`
 * would (ADR 0025); the inviter is the invited organization's admin. Then checks she is offered
 * Lindholmen by domain and nothing else.
 */
export async function seedPendingInvitee({
  db,
  seeded,
}: {
  db: Db;
  seeded: readonly Seeded[];
}): Promise<Result<null>> {
  const home = seeded.find(({ org }) => org.slug === PENDING_INVITEE.domainOf);
  const to = seeded.find(({ org }) => org.slug === PENDING_INVITEE.invitedTo);
  const inviter = to?.org.users.find((user) => user.role === ADMIN_ROLE);
  if (!home || !to || !inviter) return ok({ value: null });
  const email = demoEmail({ org: home.org, user: { name: PENDING_INVITEE.name } });
  const userId = createId();
  await db.user.create({
    data: { id: userId, name: PENDING_INVITEE.name, email, emailVerified: true },
  });
  const admin = await db.user.findUniqueOrThrow({
    where: { email: demoEmail({ org: to.org, user: inviter }) },
    select: { id: true },
  });
  const now = new Date();
  await db.invitation.create({
    data: {
      ...{ id: createId(), organizationId: to.organizationId, email, role: PENDING_INVITEE.role },
      ...{ status: "pending", code: newInvitationCode(), inviterId: admin.id, createdAt: now },
      expiresAt: new Date(now.getTime() + DEMO_INVITATION_TTL_MS),
    },
  });
  const offers = await domainOffers({ userId, db });
  const offered = offers.map((offer) => offer.organizationId).join(",");
  if (offered !== home.organizationId) {
    return fail({
      message: `${PENDING_INVITEE.name} is offered [${offered}], expected ${home.org.slug}`,
    });
  }
  return ok({ value: null });
}
