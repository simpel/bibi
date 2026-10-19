import { createId } from "@paralleldrive/cuid2";
import { AppError, type AppErrorCode } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { findInvitationConflict } from "./invitation-conflict";
import { checkCanGrantRole } from "./role-access";
import {
  InvitationIdInputSchema,
  InvitationListInputSchema,
  InvitationListOutputSchema,
  InvitationSchema,
  MemberInviteInputSchema,
} from "./schema";
import { INVITATION_SELECT, INVITATION_TTL_MS, toInvitationDto } from "./to-invitation-dto";

const fail = ({ code, message }: { code: AppErrorCode; message: string }) =>
  err({ error: new AppError({ code, message }) });

export const inviteMember = defineOperation({
  name: "member.invite",
  kind: "command",
  entityType: "invitation",
  description:
    "Invite a person by email to join the organization as staff with one fixed role (member, " +
    "manager or admin). They get an email with a link and become a " +
    "member when they accept. You cannot invite with a role above your own.",
  input: MemberInviteInputSchema,
  output: InvitationSchema,
  permission: "member:create",
  handler: async ({ input, context }) => {
    const inviterId = context.actor.userId;
    if (!inviterId)
      return fail({ code: "FORBIDDEN", message: "Invitations need a signed-in user" });
    const allowed = checkCanGrantRole({ context, role: input.role });
    if (!allowed.ok) return allowed;
    const email = input.email.toLowerCase();
    const conflict = await findInvitationConflict({ context, email });
    if (conflict) return fail({ code: "CONFLICT", message: conflict });
    const now = new Date();
    const row = await context.db.invitation.create({
      data: {
        id: createId(),
        organizationId: context.organizationId,
        email,
        role: input.role,
        status: "pending",
        inviterId,
        expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        createdAt: now,
      },
      select: INVITATION_SELECT,
    });
    const invitation = toInvitationDto({ row });
    context.recordChange({ entityId: invitation.id, after: invitation });
    return ok({ value: invitation });
  },
});

export const cancelInvitation = defineOperation({
  name: "member.cancelInvitation",
  kind: "command",
  entityType: "invitation",
  description: "Revoke a pending invitation (from member.listInvitations); its link stops working.",
  input: InvitationIdInputSchema,
  output: InvitationSchema,
  permission: "member:create",
  handler: async ({ input, context }) => {
    const before = await context.db.invitation.findFirst({
      where: { id: input.id, status: "pending" },
      select: INVITATION_SELECT,
    });
    if (!before) return fail({ code: "NOT_FOUND", message: "Pending invitation not found" });
    const row = await context.db.invitation.update({
      where: { id: input.id },
      data: { status: "canceled" },
      select: INVITATION_SELECT,
    });
    const invitation = toInvitationDto({ row });
    context.recordChange({
      entityId: invitation.id,
      before: toInvitationDto({ row: before }),
      after: invitation,
    });
    return ok({ value: invitation });
  },
});

export const listInvitations = defineOperation({
  name: "member.listInvitations",
  kind: "query",
  entityType: "invitation",
  description: "List the organization's pending, unexpired invitations with the role they give.",
  input: InvitationListInputSchema,
  output: InvitationListOutputSchema,
  permission: "member:create",
  handler: async ({ input, context }) => {
    const rows = await context.db.invitation.findMany({
      where: { status: "pending", expiresAt: { gt: new Date() } },
      select: INVITATION_SELECT,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const items = rows.map((row) => toInvitationDto({ row }));
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});
