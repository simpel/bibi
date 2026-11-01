import { type AfterCommitHook, InvitationSchema, inviteMember } from "@bibi/core";
import { getDb } from "@bibi/db";
import { sendAuthMail } from "../mail";
import { webUrl } from "../urls";

/**
 * Sends the invitation link and its invite code (ADR 0078) after `member.invite` committed (core cannot reach mail). Every
 * surface that runs commands passes it to `execute`; a failed send is logged, never undone.
 */
export const invitationMailHook: AfterCommitHook = async ({ operation, output }) => {
  if (operation.name !== inviteMember.name) return;
  const invitation = InvitationSchema.pick({
    id: true,
    email: true,
    organizationId: true,
    inviterId: true,
    code: true,
  }).parse(output);
  const [organization, inviter] = await Promise.all([
    getDb().organization.findUniqueOrThrow({ where: { id: invitation.organizationId } }),
    getDb().user.findUniqueOrThrow({ where: { id: invitation.inviterId } }),
  ]);
  const url = webUrl({ path: `/accept-invitation/${invitation.id}` });
  await sendAuthMail({
    kind: "auth.invitation",
    to: invitation.email,
    subject: `Invitation to ${organization.name} on Bibi`,
    text: invitationText({
      inviter: inviter.name,
      organization: organization.name,
      url,
      code: invitation.code,
    }),
  });
};

type InvitationTextInput = {
  inviter: string;
  organization: string;
  url: string;
  code: string | null;
};

/** The mail body: the link, and the code for "Join a different organization" in Bibi (ADR 0078). */
function invitationText({ inviter, organization, url, code }: InvitationTextInput): string {
  const accept = `${inviter} has invited you to ${organization}.\n\nAccept: ${url}`;
  if (!code) return accept;
  return `${accept}\n\nOr sign in to Bibi, choose "Join a different organization" and enter the code ${code}.`;
}
