import type { CompiledRoute } from "../http/compile-routes";
import { type JsonObject, toJsonSchema } from "../http/json-schema";
import { buildRouteParts } from "./build-parameters";
import { SECURITY_REQUIREMENTS } from "./security";

type OperationObjectInput = { compiled: CompiledRoute };
type ErrorResponseRefInput = { description: string };

const ERROR_DESCRIPTIONS: Record<string, string> = {
  "400": "Validation failed",
  "401": "Not authenticated",
  "403": "Not allowed",
  "404": "Not found",
  "409": "Conflict",
  "500": "Internal error",
};

function errorRef({ description }: ErrorResponseRefInput): JsonObject {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorBody" } } },
  };
}

function camelCase({ name }: { name: string }): string {
  return name.replace(/\.(\w)/g, (_, char: string) => char.toUpperCase());
}

export function buildOperationObject({ compiled }: OperationObjectInput): JsonObject {
  const { route, operation } = compiled;
  const { parameters, body } = buildRouteParts({ compiled });
  const output = toJsonSchema({ schema: operation.output, io: "output" });
  const errors = Object.entries(ERROR_DESCRIPTIONS).filter(
    ([status]) => status !== "409" || operation.kind === "command",
  );
  return {
    operationId: route.operationId ?? camelCase({ name: operation.name }),
    tags: [route.tag ?? operation.name.split(".")[0]],
    summary: operation.description,
    parameters,
    ...(body
      ? { requestBody: { required: true, content: { "application/json": { schema: body } } } }
      : {}),
    responses: {
      [String(route.successStatus)]: {
        description: "Success",
        content: { "application/json": { schema: output } },
      },
      ...Object.fromEntries(
        errors.map(([status, description]) => [status, errorRef({ description })]),
      ),
    },
    security: SECURITY_REQUIREMENTS,
    "x-bibi-operation": operation.name,
    "x-bibi-permission": operation.permission,
    "x-bibi-approval-required-for-ai": operation.kind === "command" && operation.approval,
  };
}
