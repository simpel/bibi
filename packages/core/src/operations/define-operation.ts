import type { z } from "zod";
import { AppError } from "../errors/app-error";
import type { Operation, OperationDefinition } from "./types";

export const OPERATION_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/;

/**
 * Declares a capability once; adapters (UI, GraphQL, REST, MCP) are derived from it.
 * Run it through `execute` – never call `handler` directly.
 */
export function defineOperation<I extends z.ZodType, O extends z.ZodType>({
  approval,
  entityType,
  ...definition
}: OperationDefinition<I, O>): Operation<I, O> {
  if (!OPERATION_NAME_PATTERN.test(definition.name)) {
    const message = `Invalid operation name "${definition.name}"`;
    throw new AppError({ code: "INTERNAL", message });
  }
  return Object.freeze({
    ...definition,
    approval: approval ?? definition.kind === "command",
    entityType: entityType ?? definition.name.split(".")[0] ?? definition.name,
  });
}
