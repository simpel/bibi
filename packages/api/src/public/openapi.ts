import type { CompiledRoute } from "../http/compile-routes";
import type { JsonObject } from "../http/json-schema";
import { buildOpenApiDocument } from "../openapi/build-document";

type Input = { compiled: readonly CompiledRoute[]; basePath: string };

/** The public document: the shared generator, minus staff security and the server-set `source`. */
export function buildPublicOpenApiDocument({ compiled, basePath }: Input): JsonObject {
  const base = buildOpenApiDocument({ compiled, basePath });
  const paths = base.paths as Record<string, Record<string, JsonObject>>;
  for (const methods of Object.values(paths)) {
    for (const operation of Object.values(methods)) {
      operation.security = [];
      for (const key of Object.keys(operation))
        if (key.startsWith("x-bibi-")) delete operation[key];
      const body = (operation.requestBody as JsonObject | undefined)?.content as
        | Record<string, { schema: { properties?: Record<string, unknown>; required?: string[] } }>
        | undefined;
      const schema = body?.["application/json"]?.schema;
      if (schema?.properties) delete schema.properties.source;
      if (schema?.required) schema.required = schema.required.filter((name) => name !== "source");
    }
  }
  const components = base.components as JsonObject;
  return {
    ...base,
    info: {
      title: "Bibi public booking API",
      version: "1.0.0",
      description:
        "Guest table booking. No key: pages are addressed by their public slug and a booking by its manage token. Rate limited per IP.",
    },
    components: { ...components, securitySchemes: {} },
  };
}
