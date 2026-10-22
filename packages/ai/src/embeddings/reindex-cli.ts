import { getDb } from "@bibi/db";
import { createEmbed } from "./create-embed";
import { reindexAll } from "./reindex/reindex-all";

// `pnpm --filter @bibi/ai reindex [--org <organizationId>]` – re-embeds index rows written by
// another embedding model and indexes missing or stale entities. Not exported from the package index.
type OrgArgInput = { args: readonly string[] };

const orgArg = ({ args }: OrgArgInput): string | undefined => {
  const flag = args.indexOf("--org");
  return flag >= 0 ? args[flag + 1] : undefined;
};

const organizationId = orgArg({ args: process.argv.slice(2) });
try {
  const report = await reindexAll({
    embed: createEmbed(),
    ...(organizationId ? { organizationId } : {}),
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  await getDb().$disconnect();
}
