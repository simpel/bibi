import {
  type AfterCommitHook,
  BillingReminderSchema,
  InvitationSchema,
  inviteMember,
  remindBillingAdmins,
} from "@bibi/core";
import { sendBillingReminderMail } from "./reminder-mail";
import { sendSeatRequestMail } from "./seat-request-mail";

const HeldSchema = InvitationSchema.pick({
  organizationId: true,
  inviterId: true,
  email: true,
  status: true,
});

/**
 * Billing mail after a commit (ADR 0095), sent here because core cannot reach mail: the seat
 * request to the admins when `member.invite` held an invitation, and the payment reminder when
 * `billing.remindAdmins` sent one. Every surface that runs commands passes it to `execute`.
 */
export const billingMailHook: AfterCommitHook = async ({ operation, output, context }) => {
  if (operation.name === inviteMember.name) {
    const invitation = HeldSchema.parse(output);
    if (invitation.status !== "held") return;
    await sendSeatRequestMail({
      organizationId: invitation.organizationId,
      requesterId: invitation.inviterId,
      inviteeEmail: invitation.email,
    });
  }
  if (operation.name === remindBillingAdmins.name) {
    const reminder = BillingReminderSchema.parse(output);
    if (!reminder.sent) return;
    await sendBillingReminderMail({
      organizationId: reminder.organizationId,
      requesterId: context.actor.userId,
    });
  }
};
