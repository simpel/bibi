/**
 * Value parsers for the small YAML subset used by SKILL.md frontmatter: plain, single- and
 * double-quoted scalars, flow lists (`[a, b]`), block lists (`- a`), one-level maps and block
 * scalars (`|`, `>`). Anything fancier (anchors, nested maps) is not supported on purpose.
 */
export type ScalarInput = { raw: string };

const DOUBLE_QUOTED = /^"((?:[^"\\]|\\.)*)"(?:\s+#.*)?$/;
const SINGLE_QUOTED = /^'((?:[^']|'')*)'(?:\s+#.*)?$/;

export function parseScalar({ raw }: ScalarInput): string {
  const value = raw.trim();
  const double = DOUBLE_QUOTED.exec(value);
  if (double) {
    try {
      return String(JSON.parse(`"${double[1] ?? ""}"`));
    } catch {
      return double[1] ?? "";
    }
  }
  const single = SINGLE_QUOTED.exec(value);
  if (single) return (single[1] ?? "").replace(/''/g, "'");
  return value.replace(/\s+#.*$/, "").trim();
}

export function parseFlowList({ raw }: ScalarInput): string[] {
  const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  return inner
    .split(",")
    .map((item) => parseScalar({ raw: item }))
    .filter((item) => item !== "");
}

export type BlockInput = { lines: readonly string[] };

function dedent({ lines }: BlockInput): string[] {
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.length - line.trimStart().length);
  const cut = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(cut).trimEnd());
}

export type BlockScalarInput = BlockInput & { folded: boolean };

export function parseBlockScalar({ lines, folded }: BlockScalarInput): string {
  const body = dedent({ lines });
  if (!folded) return body.join("\n").trim();
  return body
    .join("\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .join("\n")
    .trim();
}

/** Indented lines under `key:` → a list (`- x`) or a one-level map (`k: v`). */
export function parseNested({ lines }: BlockInput): string[] | Record<string, string> {
  const items = lines
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
  if (items.length > 0 && items.every((line) => line.startsWith("-"))) {
    return items.map((line) => parseScalar({ raw: line.slice(1) }));
  }
  const map: Record<string, string> = {};
  for (const line of items) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match?.[1]) map[match[1]] = parseScalar({ raw: match[2] ?? "" });
  }
  return map;
}
