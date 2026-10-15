import { type AfterCommitHook, InvitationSchema, inviteMember } from "@okazi/core";
import { getDb } from "@okazi/db";
import { sendAuthMail } from "../mail";
import { webUrl } from "../urls";

/**
 * Sends the invitation link after `member.invite` committed (core cannot reach mail). Every
 * surface that runs commands passes it to `execute`; a failed send is logged, never undone.
 */
export const invitationMailHook: AfterCommitHook = async ({ operation, output }) => {
  if (operation.name !== inviteMember.name) return;
  const invitation = InvitationSchema.pick({
    id: true,
    email: true,
    organizationId: true,
    inviterId: true,
  }).parse(output);
  const [organization, inviter] = await Promise.all([
    getDb().organization.findUniqueOrThrow({ where: { id: invitation.organizationId } }),
    getDb().user.findUniqueOrThrow({ where: { id: invitation.inviterId } }),
  ]);
  const url = webUrl({ path: `/accept-invitation/${invitation.id}` });
  await sendAuthMail({
    to: invitation.email,
    subject: `Invitation to ${organization.name} on Okazi`,
    text: `${inviter.name} has invited you to ${organization.name}.\n\nAccept: ${url}`,
  });
};
