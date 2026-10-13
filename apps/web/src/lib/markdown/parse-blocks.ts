import { parseInline } from "./parse-inline";
import type { Block, ListItem } from "./types";

const FENCE = /^```/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;

type Cursor = { lines: string[]; at: number };
type Read = { block: Block; next: number };

const readFence = ({ lines, at }: Cursor): Read => {
  const body: string[] = [];
  let next = at + 1;
  while (next < lines.length && !FENCE.test(lines[next] ?? "")) body.push(lines[next++] ?? "");
  return { block: { key: `${at}`, type: "code", text: body.join("\n") }, next: next + 1 };
};

type ListInput = Cursor & { pattern: RegExp; ordered: boolean };

const readList = ({ lines, at, pattern, ordered }: ListInput): Read => {
  const items: ListItem[] = [];
  let next = at;
  for (let m = pattern.exec(lines[next] ?? ""); m; m = pattern.exec(lines[next] ?? "")) {
    items.push({ key: `${next}`, children: parseInline({ text: m[1] ?? "" }) });
    next++;
  }
  return { block: { key: `${at}`, type: "list", ordered, items }, next };
};

const startsBlock = ({ line }: { line: string }): boolean =>
  FENCE.test(line) || HEADING.test(line) || BULLET.test(line) || NUMBERED.test(line);

const readParagraph = ({ lines, at }: Cursor): Read => {
  const text: string[] = [];
  let next = at;
  const continues = () => {
    const line = lines[next] ?? "";
    return next < lines.length && line.trim() && (next === at || !startsBlock({ line }));
  };
  while (continues()) text.push((lines[next++] ?? "").trim());
  const children = parseInline({ text: text.join(" ") });
  return { block: { key: `${at}`, type: "paragraph", children }, next };
};

function readBlock({ lines, at }: Cursor): Read {
  const line = lines[at] ?? "";
  if (FENCE.test(line)) return readFence({ lines, at });
  const heading = HEADING.exec(line);
  if (heading) {
    const level = (heading[1]?.length ?? 1) as 1 | 2 | 3;
    const children = parseInline({ text: heading[2] ?? "" });
    return { block: { key: `${at}`, type: "heading", level, children }, next: at + 1 };
  }
  if (BULLET.test(line)) return readList({ lines, at, pattern: BULLET, ordered: false });
  if (NUMBERED.test(line)) return readList({ lines, at, pattern: NUMBERED, ordered: true });
  const quote = QUOTE.exec(line);
  if (quote) {
    const children = parseInline({ text: quote[1] ?? "" });
    return { block: { key: `${at}`, type: "quote", children }, next: at + 1 };
  }
  return readParagraph({ lines, at });
}

export type ParseBlocksInput = { markdown: string };

/** Block-level markdown (headings, lists, fenced code, quotes, paragraphs) → blocks. */
export function parseBlocks({ markdown }: ParseBlocksInput): Block[] {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const blocks: Block[] = [];
  for (let at = 0; at < lines.length; ) {
    if (!(lines[at] ?? "").trim()) {
      at++;
      continue;
    }
    const { block, next } = readBlock({ lines, at });
    blocks.push(block);
    at = next;
  }
  return blocks;
}
