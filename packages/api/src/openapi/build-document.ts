import { APP_ERROR_CODES } from "@okazi/core";
import type { CompiledRoute } from "../http/compile-routes";
import type { JsonObject } from "../http/json-schema";
import { buildOperationObject } from "./build-operation";
import { SECURITY_SCHEMES } from "./security";

export type BuildOpenApiInput = { compiled: readonly CompiledRoute[]; basePath: string };

const ERROR_BODY = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message", "issues"],
      properties: {
        code: { enum: [...APP_ERROR_CODES] },
        message: { type: "string" },
        issues: {
          type: "array",
          items: {
            type: "object",
            required: ["path", "message"],
            properties: { path: { type: "string" }, message: { type: "string" } },
          },
        },
      },
    },
  },
};

/** OpenAPI 3.1 document derived from route metadata + the operations' Zod schemas. */
export function buildOpenApiDocument({ compiled, basePath }: BuildOpenApiInput): JsonObject {
  const paths: Record<string, JsonObject> = {};
  for (const entry of compiled) {
    const { path, method } = entry.route;
    paths[path] = {
      ...paths[path],
      [method.toLowerCase()]: buildOperationObject({ compiled: entry }),
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "Okazi API",
      version: "1.0.0",
      description:
        "REST API for Okazi (conference + food & beverage booking). Derived from the same operations as GraphQL and MCP.",
    },
    servers: [{ url: basePath }],
    paths,
    components: { securitySchemes: SECURITY_SCHEMES, schemas: { ErrorBody: ERROR_BODY } },
  };
}
