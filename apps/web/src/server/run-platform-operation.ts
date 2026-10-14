import "server-only";
import { resolvePlatformContext } from "@okazi/auth";
import { executePlatform, type PlatformOperation, type Result } from "@okazi/core";
import { runWithLogContext } from "@okazi/logger";
import { headers } from "next/headers";
import type { z } from "zod";
import { webLogContext } from "./request-log-context";

export type RunPlatformOperationInput<I extends z.ZodType, O extends z.ZodType> = {
  operation: PlatformOperation<I, O>;
  input: z.input<I>;
};

/**
 * The admin view's data-access layer (ADR 0015), the platform twin of `runOperation`: the
 * caller must be a platform admin with a browser session (`resolvePlatformContext`), then core
 * `executePlatform` validates, authorizes, audits and logs.
 */
export async function runPlatformOperation<I extends z.ZodType, O extends z.ZodType>({
  operation,
  input,
}: RunPlatformOperationInput<I, O>): Promise<Result<z.infer<O>>> {
  return runWithLogContext({
    context: await webLogContext(),
    fn: async () => {
      const context = await resolvePlatformContext({ headers: await headers() });
      if (!context.ok) return context;
      return executePlatform({ operation, input, context: context.value });
    },
  });
}
