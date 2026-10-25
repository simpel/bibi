import {
  getMemberProfile,
  listMemberProfiles,
  type MemberProfileDto,
  MemberProfileSchema,
  setMemberProfileItems,
  updateMemberProfile,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const MemberProfileRef = objectFromSchema<MemberProfileDto>({
  name: "MemberProfile",
  schema: MemberProfileSchema,
  description:
    "A member's profile inside the organization: schedule kind and the staff items they are linked to (ADR 0068).",
});
const MemberProfilePageRef = pageType({ name: "MemberProfilePage", item: MemberProfileRef });

fieldFromOperation({
  operation: listMemberProfiles,
  type: MemberProfilePageRef,
  name: "memberProfiles",
});
fieldFromOperation({ operation: getMemberProfile, type: MemberProfileRef, name: "memberProfile" });
mutationFromOperation({ operation: updateMemberProfile, type: MemberProfileRef });
mutationFromOperation({ operation: setMemberProfileItems, type: MemberProfileRef });
