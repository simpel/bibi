import {
  type ApiKeyCreated,
  type ApiKeyDto,
  ApiKeySchema,
  createApiKey,
  getApiKey,
  listApiKeys,
  revokeApiKey,
  updateApiKey,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const ApiKeyRef = objectFromSchema<ApiKeyDto>({
  name: "ApiKey",
  schema: ApiKeySchema,
  omit: ["organizationId"],
  description: "API key for the REST API, acting with one fixed role (never owner). No secret.",
});
const ApiKeyPageRef = pageType({ name: "ApiKeyPage", item: ApiKeyRef });

const ApiKeyCreatedRef = builder.objectRef<ApiKeyCreated>("ApiKeyCreated").implement({
  description: "A new API key and its secret, which is returned this one time only.",
  fields: (t) => ({
    apiKey: t.field({ type: ApiKeyRef, resolve: (result) => result.apiKey }),
    secret: t.exposeString("secret", { description: "The full key. Store it now." }),
  }),
});

fieldFromOperation({ operation: listApiKeys, type: ApiKeyPageRef, name: "apiKeys" });
fieldFromOperation({ operation: getApiKey, type: ApiKeyRef, name: "apiKey" });
mutationFromOperation({ operation: createApiKey, type: ApiKeyCreatedRef });
mutationFromOperation({ operation: revokeApiKey, type: ApiKeyRef });
mutationFromOperation({ operation: updateApiKey, type: ApiKeyRef });
