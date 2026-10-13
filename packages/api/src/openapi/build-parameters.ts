import type { CompiledRoute } from "../http/compile-routes";
import type { JsonObject } from "../http/json-schema";

export type RouteParts = { parameters: JsonObject[]; body: JsonObject | undefined };
type PartsInput = { compiled: CompiledRoute };

/** Splits the input schema: path params, query params (GET/DELETE) or a JSON body. */
export function buildRouteParts({ compiled }: PartsInput): RouteParts {
  const { inputJson, paramNames, route } = compiled;
  const properties = (inputJson.properties ?? {}) as JsonObject;
  const required = new Set((inputJson.required ?? []) as string[]);
  const pathParams = paramNames.map((name) => ({
    name,
    in: "path",
    required: true,
    schema: properties[name] ?? { type: "string" },
  }));
  const rest = Object.entries(properties).filter(([name]) => !paramNames.includes(name));
  const hasBody = route.method === "POST" || route.method === "PATCH" || route.method === "PUT";
  if (!hasBody) {
    const query = rest.map(([name, schema]) => ({
      name,
      in: "query",
      required: required.has(name),
      schema,
      ...(typeof (schema as JsonObject).description === "string"
        ? { description: (schema as JsonObject).description }
        : {}),
    }));
    return { parameters: [...pathParams, ...query], body: undefined };
  }
  const body = {
    ...inputJson,
    properties: Object.fromEntries(rest),
    required: [...required].filter((name) => !paramNames.includes(name)),
  };
  return { parameters: pathParams, body: rest.length > 0 ? body : undefined };
}
