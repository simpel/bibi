// Server render rule: what a page or layout renders on the server is prepared on the server.
// From every page and layout in apps/web, follow the imports through files without
// "use client"; none of them may call a client-only hook. Dates and numbers there come from
// `getDateTimeFormat()` and `getNumberFormat()` (server/), passed down as props; marking the
// component "use client" to make a hook work is not the fix.
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { walkSources } from "./scan.mjs";

const APP = "apps/web";
const ROOTS = /\/app\/.*\/(page|layout|template|not-found|default)\.tsx$/;
const CLIENT = /^\s*["']use client["']/;
const HOOKS =
  /\b(useDateTimeFormat|useNumberFormat|useState|useEffect|useLayoutEffect|useReducer|useRef|useContext|useMemo|useCallback|useSyncExternalStore|useTransition|useOptimistic|useActionState)\(/;
// The hooks' own modules: only reachable through a caller, which is what gets flagged.
const HOOK_MODULES = /\/lib\/(time|number)\/use-[\w-]+\.ts$/;
const IMPORT = /(?:^|\n)\s*(import|export)\s+(type\s+)?[^;]*?from\s+["']([^"']+)["']/g;

function resolveImport({ root, from, spec }) {
  const src = join(root, APP, "src");
  let base;
  if (spec.startsWith("@/")) base = join(src, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(join(root, from)), spec);
  else return null;
  for (const path of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
    if (existsSync(path) && statSync(path).isFile()) return relative(root, path);
  }
  return null;
}

/** Problems for apps/web: each file rendered on the server that calls a client-only hook. */
export function checkServerRender({ root }) {
  const files = walkSources({ dir: join(root, APP), root });
  const seen = new Set();
  const problems = [];
  const visit = ({ file, via }) => {
    if (seen.has(file)) return;
    seen.add(file);
    const content = readFileSync(join(root, file), "utf8");
    if (CLIENT.test(content)) return;
    const hook = content.match(HOOKS);
    if (hook && !HOOK_MODULES.test(file)) {
      const message = `${hook[1]}() in a component rendered on the server (via ${via}); prepare it on the server and pass it as a prop`;
      problems.push({ file, message });
    }
    for (const [, , isType, spec] of content.matchAll(IMPORT)) {
      if (isType) continue;
      const target = resolveImport({ root, from: file, spec });
      if (target) visit({ file: target, via: file });
    }
  };
  for (const file of files.filter((path) => ROOTS.test(path))) visit({ file, via: file });
  return { problems };
}
