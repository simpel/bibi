import { elapsedMs } from "@bibi/logger";
import type { z } from "zod";
import { AppError } from "../errors/app-error";
import { fromUnknown } from "../errors/from-unknown";
import { err, ok, type Result } from "../errors/result";
import { logOperation } from "../operations/log-operation";
import { parseWith } from "../operations/parse-with";
import { SUPERADMIN_ROLE } from "../permissions/fixed-roles";
import { runPlatformCommand, runPlatformQuery } from "./run-platform";
import type { AnyPlatformOperation, PlatformContext, PlatformOperation } from "./types";

export type ExecutePlatformInput<I extends z.ZodType, O extends z.ZodType> = {
  operation: PlatformOperation<I, O>;
  input: unknown;
  context: PlatformContext;
};

/** Trusted system code, or a user whose platform role was verified by `@bibi/auth`. */
function authorizePlatform({ context }: { context: PlatformContext }): Result<true> {
  const { actor, platformRole } = context;
  if (actor.type === "system") return ok({ value: true });
  if (actor.type === "user" && platformRole === SUPERADMIN_ROLE) return ok({ value: true });
  return err({ error: new AppError({ code: "FORBIDDEN", message: "Superadmins only" }) });
}

type AttemptInput = { operation: AnyPlatformOperation; input: unknown; context: PlatformContext };

async function attempt({ operation, input, context }: AttemptInput): Promise<Result<unknown>> {
  const parsed = parseWith({ schema: operation.input, data: input, side: "input" });
  if (!parsed.ok) return parsed;
  const allowed = authorizePlatform({ context });
  if (!allowed.ok) return allowed;
  try {
    const run = operation.kind === "command" ? runPlatformCommand : runPlatformQuery;
    return await run({ operation, input: parsed.value, context });
  } catch (error) {
    return err({ error: fromUnknown({ error }) });
  }
}

/**
 * The only way to run a platform operation (ADR 0015): validate → authorize (superadmin) →
 * handle → validate → audit (`PLATFORM_SCOPE`), and one system-log line per call (ADR 0014).
 */
export async function executePlatform<I extends z.ZodType, O extends z.ZodType>({
  operation,
  input,
  context,
}: ExecutePlatformInput<I, O>): Promise<Result<z.infer<O>>> {
  const op: AnyPlatformOperation = operation;
  const since = performance.now();
  const result = await attempt({ operation: op, input, context });
  logOperation({
    operation: op,
    context: { actor: context.actor },
    result,
    durationMs: elapsedMs({ since }),
  });
  return result as Result<z.infer<O>>;
}
