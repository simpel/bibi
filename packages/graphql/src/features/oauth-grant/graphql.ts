import {
  listOauthGrants,
  type OauthGrantDto,
  OauthGrantSchema,
  revokeOauthGrant,
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const OauthGrantRef = objectFromSchema<OauthGrantDto>({
  name: "OauthGrant",
  schema: OauthGrantSchema,
  description: "An OAuth/MCP client the signed-in user has connected to the organization.",
});
const OauthGrantPageRef = pageType({ name: "OauthGrantPage", item: OauthGrantRef });

fieldFromOperation({ operation: listOauthGrants, type: OauthGrantPageRef, name: "oauthGrants" });
mutationFromOperation({ operation: revokeOauthGrant, type: OauthGrantRef });
