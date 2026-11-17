// Database import rule (ADR 0004, 0113): business data is reached only through core operations,
// whose scoped client enforces organization and record access. A runtime import of `@bibi/db`
// outside db, core and auth would bypass both. Type-only imports grant no access and are fine.

const OWNERS = /^packages\/(db|core|auth)\//;
const EXEMPT_TESTS = /\.(test|stories)\.tsx?$|(^|\/)(test|e2e)\//;

// Infrastructure that needs the client itself, each with its reason. Shrink, never grow casually.
export const DB_IMPORT_EXEMPTIONS = {
  "apps/mcp/src/stdio.ts": "the system log sink (logging infrastructure)",
  "apps/web/src/instrumentation-node.ts": "the system log sink (logging infrastructure)",
  "apps/worker/src/main.ts": "process bootstrap: the log sink and the client handed to jobs",
  "apps/worker/src/jobs/pseudonymise-audit-log.ts": "retention across organizations (ADR 0014)",
  "apps/web/scripts/provision-web-oauth-client.ts": "ops script on Better Auth's OAuth tables",
  "packages/ai/src/embeddings/hash-embedding.ts": "the embedding dimension constant",
  "packages/ai/src/embeddings/embed-texts.ts": "the embedding dimension constant",
  "packages/ai/src/embeddings/reindex-cli.ts": "the search reindexer runs as SYSTEM",
  "packages/ai/src/embeddings/reindex/reindex-all.ts": "the search reindexer runs as SYSTEM",
  "packages/ai/src/embeddings/reindex/reembed-stale-rows.ts": "the search reindexer runs as SYSTEM",
  "packages/ai/src/embeddings/reindex/index-stale-entities.ts":
    "the search reindexer runs as SYSTEM",
};

const IMPORT = /\bimport\s+(type\s+)?([^;]*?)\s+from\s+["']@bibi\/db(?:\/[^"']*)?["']/g;
const DYNAMIC = /\bimport\(\s*["']@bibi\/db(?:\/[^"']*)?["']\s*\)/;

function stripComments({ content }) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

/** `import { type A, type B }` is type-only too. */
function typeOnly({ keyword, clause }) {
  if (keyword) return true;
  const named = clause.match(/^\{([\s\S]*)\}$/);
  if (!named) return false;
  const names = named[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return names.length > 0 && names.every((name) => name.startsWith("type "));
}

/** Problems for one file: runtime `@bibi/db` imports outside its owners and the exemptions. */
export function checkDbImport({ relPath, content }) {
  if (OWNERS.test(relPath) || EXEMPT_TESTS.test(relPath)) return [];
  if (relPath in DB_IMPORT_EXEMPTIONS) return [];
  const code = stripComments({ content });
  const problems = [];
  for (const match of code.matchAll(IMPORT)) {
    if (typeOnly({ keyword: match[1], clause: match[2].trim() })) continue;
    const line = code.slice(0, match.index).split("\n").length;
    problems.push(`line ${line}: runtime import of @bibi/db outside core (use a core operation)`);
  }
  if (DYNAMIC.test(code)) problems.push("dynamic import of @bibi/db outside core");
  return problems;
}
