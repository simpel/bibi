import { getEnv } from "@okazi/config";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";

/** The demo seed deletes and recreates organizations: never in production (ADR 0019). */
export function refuseProduction(): Result<true> {
  if (getEnv().NODE_ENV !== "production") return ok({ value: true });
  const message = "seed:demo refuses to run with NODE_ENV=production";
  return err({ error: new AppError({ code: "FORBIDDEN", message }) });
}
