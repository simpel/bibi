import type { FixedRole } from "@bibi/core";
import { getAuth } from "../src/index";
import { createOrg, signIn, signUp } from "./helpers";

export type AddMemberInput = { organizationId: string; userId: string; role: string };

/** Adds a member through Better Auth (its `beforeAddMember` hook allows fixed roles only). */
export async function addMember({ organizationId, userId, role }: AddMemberInput): Promise<void> {
  // Better Auth types `role` as the configured roles; tests also try names that are refused.
  const body = { userId, organizationId, role: role as FixedRole };
  await getAuth().api.addMember({ body });
}

export type MemberSessionInput = { role: FixedRole };

/** An owner's new organization plus a signed-in member with `role` in it. */
export async function memberSession({ role }: MemberSessionInput) {
  const owner = await signUp();
  const organizationId = await createOrg({ headers: owner.headers });
  const user = await signUp();
  await addMember({ organizationId, userId: user.userId, role });
  const headers = await signIn({ email: user.email });
  return { organizationId, owner, user, headers };
}
