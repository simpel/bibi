import {
  assignMemberRole,
  cancelInvitation,
  type InvitationDto,
  InvitationSchema,
  inviteMember,
  listInvitations,
  listMembers,
  type MemberDto,
  MemberSchema,
  removeMember,
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const MemberRef = objectFromSchema<MemberDto>({
  name: "Member",
  schema: MemberSchema,
  omit: ["organizationId"],
  description: "Staff member of the organization with their fixed access role.",
});
const MemberPageRef = pageType({ name: "MemberPage", item: MemberRef });

export const InvitationRef = objectFromSchema<InvitationDto>({
  name: "Invitation",
  schema: InvitationSchema,
  omit: ["organizationId"],
  description: "Invitation to join the organization as staff, with the fixed role it gives.",
});
const InvitationPageRef = pageType({ name: "InvitationPage", item: InvitationRef });

fieldFromOperation({ operation: listMembers, type: MemberPageRef, name: "members" });
mutationFromOperation({ operation: assignMemberRole, type: MemberRef });
mutationFromOperation({ operation: removeMember, type: MemberRef });
fieldFromOperation({ operation: listInvitations, type: InvitationPageRef, name: "invitations" });
mutationFromOperation({ operation: inviteMember, type: InvitationRef });
mutationFromOperation({ operation: cancelInvitation, type: InvitationRef });
