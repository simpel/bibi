import { getDb } from "@bibi/db";
import { runWithLogContext } from "@bibi/logger";
import { refuseProduction } from "./guard";
import { cleanupTestLeftovers } from "./test-leftovers";

// `pnpm --filter @bibi/core cleanup:test-orgs` – opt-in, never run automatically. Lists the
// organizations (and their test-domain users) that old test runs left in the database `.env`
// points at; `-- --yes` deletes them. The canonical demo organizations and every organization
// with a real member are kept. Tests use their own `<db>_test` database now (`pnpm test:db`).
const dryRun = !process.argv.includes("--yes");
await runWithLogContext({
  context: { surface: "cli" },
  fn: async () => {
    const allowed = refuseProduction();
    if (!allowed.ok) {
      process.stderr.write(`${allowed.error.message}\n`);
      process.exitCode = 1;
      return;
    }
    const result = await cleanupTestLeftovers({ db: getDb(), dryRun });
    const verb = dryRun ? "Would delete" : "Deleted";
    process.stdout.write(`${verb} ${result.organizations} organizations, ${result.users} users.\n`);
    if (dryRun) process.stdout.write("Dry run. Pass `-- --yes` to delete.\n");
  },
});
await getDb().$disconnect();
