import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { parseBlockScalar, parseFlowList, parseNested, parseScalar } from "./yaml-values";

export type FrontmatterValue = string | string[] | Record<string, string>;
export type Frontmatter = Record<string, FrontmatterValue>;

const KEY_LINE = /^([A-Za-z0-9_-]+):(?:[ \t]+(.*))?[ \t]*$/;

type ValueInput = { raw: string; block: readonly string[] };

function parseValue({ raw, block }: ValueInput): FrontmatterValue {
  if (/^[|>][+-]?$/.test(raw)) return parseBlockScalar({ lines: block, folded: raw[0] === ">" });
  if (raw === "") return block.some((line) => line.trim() !== "") ? parseNested({ lines: block }) : "";
  if (raw.startsWith("[")) return parseFlowList({ raw });
  const continued = block.map((line) => line.trim()).filter((line) => line !== "");
  if (continued.length > 0 && !/^["']/.test(raw)) {
    return parseScalar({ raw: [raw, ...continued].join(" ") });
  }
  return parseScalar({ raw });
}

type BlockEndInput = { lines: readonly string[]; from: number };

/** Index after the indented (or blank) lines that belong to the key on line `from - 1`. */
function blockEnd({ lines, from }: BlockEndInput): number {
  let end = from;
  while (end < lines.length && (/^[ \t]/.test(lines[end] ?? "") || lines[end]?.trim() === "")) {
    end++;
  }
  return end;
}

export type ParseFrontmatterInput = { yaml: string };

/** Parses SKILL.md frontmatter (YAML subset, see yaml-values.ts) into a flat record. */
export function parseFrontmatter({ yaml }: ParseFrontmatterInput): Result<Frontmatter> {
  const lines = yaml.split(/\r?\n/);
  const out: Frontmatter = {};
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      index++;
      continue;
    }
    const match = KEY_LINE.exec(line);
    if (!match?.[1]) {
      const message = `Unsupported frontmatter on line ${index + 1}`;
      return err({ error: new AppError({ code: "VALIDATION", message }) });
    }
    const end = blockEnd({ lines, from: index + 1 });
    out[match[1]] = parseValue({ raw: (match[2] ?? "").trim(), block: lines.slice(index + 1, end) });
    index = end;
  }
  return ok({ value: out });
}
