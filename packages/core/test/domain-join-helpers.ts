import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { type ExecuteContext, execute, setOrganizationDomainJoin } from "../src/index";
import { testContext } from "./helpers";
import { testOrg } from "./org-helpers";

export type DomainUserInput = { email: string; verified?: boolean };

/** A user with `email`, verified unless said otherwise. */
export const createUser = async ({ email, verified = true }: DomainUserInput) => {
  const id = `user_${createId()}`;
  await getDb().user.create({ data: { id, name: "Test", email, emailVerified: verified } });
  return id;
};

/** An organization whose admin (the caller) signed in with `email` (ADR 0076). */
export const orgWithAdmin = async ({
  email,
  verified,
}: DomainUserInput): Promise<ExecuteContext> => {
  const userId = await createUser({ email, ...(verified === undefined ? {} : { verified }) });
  const base = await testOrg();
  const context = testContext({
    organizationId: base.organizationId,
    actor: { type: "user", userId },
  });
  const member = { id: `member_${createId()}`, userId, role: "admin", createdAt: new Date() };
  await getDb().member.create({ data: { ...member, organizationId: context.organizationId } });
  return context;
};

/** A fresh work domain per test, so tests never see each other's claims. */
export const domain = () => `venue-${createId().slice(0, 8)}.test`;

export const turn = ({ context, enabled }: { context: ExecuteContext; enabled: boolean }) =>
  execute({ operation: setOrganizationDomainJoin, input: { enabled }, context });
