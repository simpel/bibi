import { getDb } from "@bibi/db";
import { initLogger } from "@bibi/logger";
import { setPlatformAdmin } from "./set-platform-admin";

// `pnpm --filter @bibi/auth grant-superadmin <email> [--revoke]` – the only way to make someone a
// superadmin (ADR 0015). The admin plugin's HTTP endpoints are disabled.
initLogger({ service: "cli" });

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"));
const revoke = args.includes("--revoke");

if (!email) {
  process.stderr.write("Usage: grant-superadmin <email> [--revoke]\n");
  process.exitCode = 1;
} else {
  const result = await setPlatformAdmin({ email, admin: !revoke });
  if (result) {
    process.stdout.write(`${email}: role=${result.role}\n`);
  } else {
    process.stderr.write(`No user with email ${email}\n`);
    process.exitCode = 1;
  }
}
await getDb().$disconnect();
