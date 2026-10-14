import { assignMemberRole, listMembers, type MemberDto, MemberSchema } from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const MemberRef = objectFromSchema<MemberDto>({
  name: "Member",
  schema: MemberSchema,
  omit: ["organizationId"],
  description: "Staff member of the organization with their role names.",
});
const MemberPageRef = pageType({ name: "MemberPage", item: MemberRef });

fieldFromOperation({ operation: listMembers, type: MemberPageRef, name: "members" });
mutationFromOperation({ operation: assignMemberRole, type: MemberRef });
