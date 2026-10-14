import type { z } from "zod";
import { AppError } from "../errors/app-error";
import { OPERATION_NAME_PATTERN } from "../operations/define-operation";
import type { PlatformOperation, PlatformOperationDefinition } from "./types";

/**
 * Declares a platform operation (ADR 0015): product-wide, not tenant data, platform admins only,
 * web-only by decision. Run it through `executePlatform` – never call `handler` directly.
 */
export function definePlatformOperation<I extends z.ZodType, O extends z.ZodType>({
  entityType,
  ...definition
}: PlatformOperationDefinition<I, O>): PlatformOperation<I, O> {
  if (!OPERATION_NAME_PATTERN.test(definition.name)) {
    const message = `Invalid operation name "${definition.name}"`;
    throw new AppError({ code: "INTERNAL", message });
  }
  return Object.freeze({
    ...definition,
    scope: "platform" as const,
    entityType: entityType ?? definition.name.split(".")[0] ?? definition.name,
  });
}
