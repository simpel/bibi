import type { Db } from "@okazi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { checkDemoMegaAdmin } from "./mega-admin-checks";
import { seedMegaAdmin } from "./seed-mega-admin";

export type RunMegaAdminInput = { db: Db; organizationIds: readonly string[] };

/** Seeds the mega admin for the given organizations, then checks it; failures are an error. */
export async function runMegaAdmin({
  db,
  organizationIds,
}: RunMegaAdminInput): Promise<Result<null>> {
  await seedMegaAdmin({ db, organizationIds });
  const failures = await checkDemoMegaAdmin({ db, organizationIds });
  if (failures.length === 0) return ok({ value: null });
  const message = `Demo checks failed:\n${failures.join("\n")}`;
  return err({ error: new AppError({ code: "INTERNAL", message }) });
}
