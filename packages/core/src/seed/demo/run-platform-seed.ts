import type { Db } from "@bibi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { checkDemoAiModels } from "./ai-model-checks";
import { checkDemoMegaAdmin } from "./mega-admin-checks";
import { seedAiModels } from "./seed-ai-models";
import { seedMegaAdmin } from "./seed-mega-admin";

export type RunPlatformSeedInput = { db: Db; organizationIds: readonly string[] };

/**
 * The platform side of the demo seed: the mega admin (admin of every given organization) and a
 * model for each AI feature, set by the mega admin. Then checks both; failures are an error.
 */
export async function runPlatformSeed({
  db,
  organizationIds,
}: RunPlatformSeedInput): Promise<Result<null>> {
  const mega = await seedMegaAdmin({ db, organizationIds });
  await seedAiModels({ db, updatedBy: mega.id });
  const failures = [
    ...(await checkDemoMegaAdmin({ db, organizationIds })),
    ...(await checkDemoAiModels({ db })),
  ];
  if (failures.length === 0) return ok({ value: null });
  const message = `Demo checks failed:\n${failures.join("\n")}`;
  return err({ error: new AppError({ code: "INTERNAL", message }) });
}
