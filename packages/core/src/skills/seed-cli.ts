import { getDb } from "@okazi/db";
import { seedSystemSkills } from "./seed-system-skills";

// `pnpm --filter @okazi/core seed:skills` – seeds SYSTEM skills (no search indexing: core has no
// embedder; apps call `seedSystemSkills({ embed })` at startup to index them).
const result = await seedSystemSkills();
if (result.ok) {
  process.stdout.write(`${JSON.stringify(result.value, null, 2)}\n`);
} else {
  process.stderr.write(`${result.error.message}\n`);
  process.exitCode = 1;
}
await getDb().$disconnect();
