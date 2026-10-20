import { getApiKey, listApiKeys } from "./read-operations";
import { createApiKey, revokeApiKey, updateApiKey } from "./write-operations";

/** Every API key operation (ADR 0005); implementations live in the sibling `*-operations.ts`. */
export const apiKeyOperations = [listApiKeys, getApiKey, createApiKey, updateApiKey, revokeApiKey];
