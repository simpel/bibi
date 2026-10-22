import { type AnyOperation, AppError } from "@bibi/core";
import type { RestRoute } from "../rest-route";
import { type JsonObject, type PropertyKind, propertyKind, toJsonSchema } from "./json-schema";

export type CompiledRoute = {
  route: RestRoute;
  operation: AnyOperation;
  pattern: RegExp;
  paramNames: string[];
  inputJson: JsonObject;
  kinds: Record<string, PropertyKind>;
};

export type CompileRoutesInput = {
  routes: readonly RestRoute[];
  operations: readonly AnyOperation[];
};
type PathPatternInput = { path: string };

const PARAM = /\{(\w+)\}/g;

function pathPattern({ path }: PathPatternInput): { pattern: RegExp; paramNames: string[] } {
  const paramNames = [...path.matchAll(PARAM)].map((match) => match[1] ?? "");
  const source = path.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(PARAM, "([^/]+)");
  return { pattern: new RegExp(`^${source}$`), paramNames };
}

/** Resolves each route's operation once and precomputes matching + query coercion data. */
export function compileRoutes({ routes, operations }: CompileRoutesInput): CompiledRoute[] {
  const byName = new Map(operations.map((operation) => [operation.name, operation]));
  return routes.map((route) => {
    const operation = byName.get(route.operation);
    if (!operation) {
      const message = `REST route ${route.method} ${route.path}: unknown operation "${route.operation}"`;
      throw new AppError({ code: "INTERNAL", message });
    }
    const inputJson = toJsonSchema({ schema: operation.input, io: "input" });
    const properties = (inputJson.properties ?? {}) as JsonObject;
    const kinds = Object.fromEntries(
      Object.entries(properties).map(([name, property]) => [name, propertyKind({ property })]),
    );
    return { route, operation, inputJson, kinds, ...pathPattern({ path: route.path }) };
  });
}
