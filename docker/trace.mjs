// Copies only the files a bundled Node app loads at runtime into an output folder, the way Next's
// standalone output does for web: pnpm deploy ships whole packages plus resolved optional peers
// (next, the Prisma CLI, typescript), most of which the app never imports.
// Usage: node docker/trace.mjs <out> <entry> [<entry> ...]   (paths relative to the repo root)
import { cp, lstat, mkdir, readlink, symlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { nodeFileTrace } from "@vercel/nft";

const [out, ...entries] = process.argv.slice(2);
if (!out || entries.length === 0) {
  throw new Error("usage: node docker/trace.mjs <out> <entry> [<entry> ...]");
}

const root = process.cwd();
const { fileList, warnings } = await nodeFileTrace(entries, { base: root });
for (const warning of warnings) {
  // nft warns about dynamic requires it cannot follow; the runtime check after the build catches real gaps.
  process.stderr.write(`trace: ${warning.message}\n`);
}

// pnpm links packages into place, so keep symlinks as symlinks: copying them as files would load a
// package twice under two paths.
for (const file of [...fileList].sort()) {
  const from = join(root, file);
  const to = join(out, file);
  await mkdir(dirname(to), { recursive: true });
  const stat = await lstat(from);
  if (stat.isSymbolicLink()) {
    await symlink(await readlink(from), to).catch((error) => {
      if (error.code !== "EEXIST") throw error;
    });
  } else if (stat.isFile()) {
    await cp(from, to, { preserveTimestamps: true });
  }
}
process.stdout.write(`trace: ${fileList.size} files from ${entries.join(", ")} into ${out}\n`);
