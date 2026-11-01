import { getDb } from "@bibi/db";
import { isDevEnvironment } from "./dev-users";

export type DevInvitationCode = { organization: string; code: string };

export type ListDevInvitationCodesInput = { email: string };

/**
 * The invite codes waiting for `email` (ADR 0076), so `/welcome/join` can show them in `next dev`
 * where the invitation mail is out of reach. Empty outside development: a code is a credential.
 */
export async function listDevInvitationCodes({
  email,
}: ListDevInvitationCodesInput): Promise<DevInvitationCode[]> {
  if (!isDevEnvironment()) return [];
  const invitations = await getDb().invitation.findMany({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: "pending",
      expiresAt: { gt: new Date() },
      code: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: { code: true, organization: { select: { name: true } } },
  });
  return invitations.flatMap(({ code, organization }) =>
    code ? [{ organization: organization.name, code }] : [],
  );
}
