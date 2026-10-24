import { getDb } from "@bibi/db";
import { runWithLogContext } from "@bibi/logger";
import { seedDemo } from "./seed-demo";

// `pnpm --filter @bibi/core seed:demo` – recreates the demo organizations (ADR 0025).
// `-- --skip-pipeline` leaves out statuses, item states, the grid and tickets (first setup, ADR 0045).
const skipPipeline = process.argv.includes("--skip-pipeline");
await runWithLogContext({
  context: { surface: "cli" },
  fn: async () => {
    const result = await seedDemo({ skipPipeline });
    if (result.ok) {
      process.stdout.write(`${JSON.stringify(result.value, null, 2)}\n`);
    } else {
      process.stderr.write(`${result.error.message}\n`);
      process.exitCode = 1;
    }
  },
});
await getDb().$disconnect();
