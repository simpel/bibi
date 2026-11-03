import "server-only";
import { getAuth } from "@bibi/auth";
import { headers } from "next/headers";
import type { UserInvitation } from "./user-invitation-type";

/** Pending invitations for the signed-in email (Better Auth `listUserInvitations`). */
export async function loadUserInvitations(): Promise<UserInvitation[]> {
  const invitations = await getAuth()
    .api.listUserInvitations({ headers: await headers() })
    .catch(() => []);
  return invitations.map(({ id, organizationName, role }) => ({ id, organizationName, role }));
}
