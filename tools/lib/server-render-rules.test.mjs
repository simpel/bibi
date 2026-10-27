// Tests for the server render rule: node --test tools/lib/server-render-rules.test.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { checkServerRender } from "./server-render-rules.mjs";

const PAGE = "apps/web/src/app/[locale]/x/page.tsx";

function tree({ files }) {
  const root = mkdtempSync(join(tmpdir(), "server-render-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function problemsIn({ files }) {
  const root = tree({ files });
  try {
    return checkServerRender({ root }).problems.map((problem) => problem.file);
  } finally {
    rmSync(root, { recursive: true });
  }
}

test("flags a client hook in a component a page renders, also a few imports away", () => {
  const files = {
    [PAGE]: 'import { List } from "@/features/a/list";\nexport default function P() {}',
    "apps/web/src/features/a/list.tsx": 'import { Row } from "./row";\nexport function List() {}',
    "apps/web/src/features/a/row.tsx": "export function Row() { const f = useDateTimeFormat(); }",
  };
  assert.deepEqual(problemsIn({ files }), ["apps/web/src/features/a/row.tsx"]);
});

test("stops at a client boundary and skips type-only imports", () => {
  const files = {
    [PAGE]: 'import { Island } from "./island";\nimport type { T } from "./typed";\n',
    "apps/web/src/app/[locale]/x/island.tsx": '"use client";\nimport { Row } from "./row";',
    "apps/web/src/app/[locale]/x/row.tsx": "useNumberFormat();",
    "apps/web/src/app/[locale]/x/typed.ts": "useState();",
  };
  assert.deepEqual(problemsIn({ files }), []);
});

test("does not flag server formatters or files no page reaches", () => {
  const files = {
    [PAGE]: "const f = await getDateTimeFormat();",
    "apps/web/src/features/b/orphan.tsx": "useState();",
  };
  assert.deepEqual(problemsIn({ files }), []);
});
