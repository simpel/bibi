import { getDb } from "@okazi/db";
import { seedDemo } from "./seed-demo";

// `pnpm --filter @okazi/core seed:demo` – recreates the demo organizations (ADR 0025).
const result = await seedDemo();
if (result.ok) {
  process.stdout.write(`${JSON.stringify(result.value, null, 2)}\n`);
} else {
  process.stderr.write(`${result.error.message}\n`);
  process.exitCode = 1;
}
await getDb().$disconnect();
