import { getDb } from "@okazi/db";
import { runWithLogContext } from "@okazi/logger";
import { seedSystemSkills } from "./seed-system-skills";

// `pnpm --filter @okazi/core seed:skills` – seeds SYSTEM skills (no search indexing: core has no
// embedder; apps call `seedSystemSkills({ embed })` at startup to index them).
await runWithLogContext({
  context: { surface: "cli" },
  fn: async () => {
    const result = await seedSystemSkills();
    if (result.ok) {
      process.stdout.write(`${JSON.stringify(result.value, null, 2)}\n`);
    } else {
      process.stderr.write(`${result.error.message}\n`);
      process.exitCode = 1;
    }
  },
});
await getDb().$disconnect();
