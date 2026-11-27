import "server-only";
import { type AnyOperation, type Operation, type Result, runGuest } from "@bibi/core";
import { runWithLogContext } from "@bibi/logger";
import type { z } from "zod";
import { ensureOperations } from "@/server/operations";
import { webLogContext } from "@/server/request-log-context";
import { type GuestPin, organizationOfPin } from "./guest-pin";

export type RunGuestOperationInput<I extends z.ZodType, O extends z.ZodType> = {
  pin: GuestPin;
  operation: Operation<I, O>;
  input: z.input<I>;
};

/**
 * The guest pages' one path into core (ADR 0119): no session, the slug or token pins the
 * organization at the edge and core runs the system-only operation with guest permissions. The
 * request context is opened here, as for the payment page (ADR 0014).
 */
export async function runGuestOperation<I extends z.ZodType, O extends z.ZodType>({
  pin,
  operation,
  input,
}: RunGuestOperationInput<I, O>): Promise<Result<z.output<O>>> {
  const context = await webLogContext();
  // Installs the file store and the reservation mailer the guest commands reach through core.
  ensureOperations();
  return runWithLogContext({
    context,
    fn: async () => {
      const organizationId = await organizationOfPin({ pin });
      const result = await runGuest({
        organizationId,
        operation: operation as unknown as AnyOperation,
        input,
      });
      return result as Result<z.output<O>>;
    },
  });
}
