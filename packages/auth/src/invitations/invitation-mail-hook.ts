import { type AfterCommitHook, approveSeat, InvitationSchema, inviteMember } from "@bibi/core";
import { getDb } from "@bibi/db";
import { renderInvitationEmail } from "@bibi/mail";
import { sendAuthMail } from "../mail";
import { webUrl } from "../urls";
import { resolveUserLocale } from "../user-locale";

/**
 * Sends the invitation link and its invite code (ADR 0078) after `member.invite` or
 * `billing.approveSeat` committed (core cannot reach mail); a held invitation waits. Every
 * surface that runs commands passes it to `execute`; a failed send is logged, never undone.
 */
export const invitationMailHook: AfterCommitHook = async ({ operation, output }) => {
  // An approved seat sends the invitation that was held for it (ADR 0095 §6).
  if (operation.name !== inviteMember.name && operation.name !== approveSeat.name) return;
  const invitation = InvitationSchema.pick({
    id: true,
    email: true,
    organizationId: true,
    inviterId: true,
    code: true,
    status: true,
  }).parse(output);
  if (invitation.status !== "pending") return;
  const db = getDb();
  const [organization, inviter] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: invitation.organizationId } }),
    db.user.findUniqueOrThrow({ where: { id: invitation.inviterId } }),
  ]);
  const url = webUrl({ path: `/accept-invitation/${invitation.id}` });

  const inviteeUser = await db.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });
  const locale = await resolveUserLocale(
    inviteeUser
      ? { userId: inviteeUser.id, email: invitation.email }
      : { userId: invitation.inviterId },
  );

  const rendered = renderInvitationEmail({
    inviter: inviter.name,
    organization: organization.name,
    url,
    code: invitation.code,
    locale,
  });

  await sendAuthMail({
    kind: "auth.invitation",
    to: invitation.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
};
