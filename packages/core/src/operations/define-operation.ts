import type { z } from "zod";
import { AppError } from "../errors/app-error";
import type { Operation, OperationDefinition } from "./types";

const NAME_PATTERN = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/;

/**
 * Declares a capability once; adapters (UI, GraphQL, REST, MCP) are derived from it.
 * Run it through `execute` – never call `handler` directly.
 */
export function defineOperation<I extends z.ZodType, O extends z.ZodType>(
  definition: OperationDefinition<I, O>,
): Operation<I, O> {
  if (!NAME_PATTERN.test(definition.name)) {
    throw new AppError({
      code: "INTERNAL",
      message: `Invalid operation name "${definition.name}"`,
    });
  }
  return Object.freeze({
    ...definition,
    approval: definition.approval ?? definition.kind === "command",
    entityType: definition.entityType ?? definition.name.split(".")[0] ?? definition.name,
  });
}
