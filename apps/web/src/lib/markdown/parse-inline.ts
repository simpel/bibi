import type { Inline } from "./types";

const TOKEN = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
const SAFE_HREF = /^(https?:\/\/|\/(?!\/)|mailto:)/i;

export type ParseInlineInput = { text: string; offset?: number };

type TokenInput = { match: RegExpExecArray; key: string; offset: number };

function toToken({ match, key, offset }: TokenInput): Inline {
  const [, bold, italic, code, label, href] = match;
  const inner = offset + match.index;
  if (bold) return { key, type: "bold", children: parseInline({ text: bold, offset: inner + 2 }) };
  if (italic)
    return { key, type: "italic", children: parseInline({ text: italic, offset: inner + 1 }) };
  if (code) return { key, type: "code", text: code };
  const children = parseInline({ text: label ?? "", offset: inner + 1 });
  // Only plain web/mail/relative links become anchors; `javascript:` etc. stay as text.
  if (href && SAFE_HREF.test(href)) return { key, type: "link", href, children };
  return { key, type: "text", text: match[0] };
}

/** Inline markdown (bold, italic, code, links) → a small tree. Never produces HTML strings. */
export function parseInline({ text, offset = 0 }: ParseInlineInput): Inline[] {
  const nodes: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > last)
      nodes.push({ key: `${offset + last}`, type: "text", text: text.slice(last, at) });
    nodes.push(toToken({ match: match as RegExpExecArray, key: `${offset + at}`, offset }));
    last = at + match[0].length;
  }
  if (last < text.length) {
    nodes.push({ key: `${offset + last}`, type: "text", text: text.slice(last) });
  }
  return nodes;
}
