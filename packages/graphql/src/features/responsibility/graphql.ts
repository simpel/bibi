import {
  archiveResponsibility,
  createResponsibility,
  getResponsibility,
  listResponsibilities,
  type ResponsibilityDto,
  ResponsibilitySchema,
  updateResponsibility,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const ResponsibilityRef = objectFromSchema<ResponsibilityDto>({
  name: "Responsibility",
  schema: ResponsibilitySchema,
  omit: ["organizationId"],
  description:
    "Responsibility – what someone answers for (e.g. Head of kitchen): covered item types, " +
    "default assignee and default followers.",
});
const ResponsibilityPageRef = pageType({ name: "ResponsibilityPage", item: ResponsibilityRef });

fieldFromOperation({
  operation: listResponsibilities,
  type: ResponsibilityPageRef,
  name: "responsibilities",
});
fieldFromOperation({
  operation: getResponsibility,
  type: ResponsibilityRef,
  name: "responsibility",
});
mutationFromOperation({ operation: createResponsibility, type: ResponsibilityRef });
mutationFromOperation({ operation: updateResponsibility, type: ResponsibilityRef });
mutationFromOperation({ operation: archiveResponsibility, type: ResponsibilityRef });
