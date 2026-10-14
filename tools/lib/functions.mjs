// Function length: a heuristic using brace matching. Finds function declarations,
// arrow functions assigned to const/let, and methods. React components count as functions.

export const MAX_FUNCTION_LINES = 40;

const HEADER = new RegExp(
  [
    String.raw`\bfunction\b\s*\*?\s*\w*\s*(?:<[^>\n]*>)?\s*\([^)]*\)\s*(?::[^{;]*)?\{`,
    String.raw`\b(?:const|let)\s+\w+\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*(?::[^=\n]+?)?=>\s*[{(]`,
    String.raw`^[ \t]+(?:(?:public|private|protected|static|override|async)\s+)*\w+\s*\([^)]*\)\s*(?::[^{;\n]*)?\{`,
  ].join("|"),
  "gm",
);
// Control statements that look like methods (e.g. "if (x) {") are not counted.
const SKIP_WORDS = new Set(["if", "for", "while", "switch", "catch", "with"]);

export function analyzeFunctions({ content }) {
  const starts = lineStartOffsets({ content });
  const problems = [];
  for (const [opener, { start, text }] of findHeaders({ content })) {
    const close = findClose({ content, opener });
    if (close < 0) continue;
    const firstLine = lineOf({ starts, offset: start });
    const length = lineOf({ starts, offset: close }) - firstLine + 1;
    if (length > MAX_FUNCTION_LINES) {
      problems.push(
        `function at line ${firstLine + 1} is ${length} lines (max ${MAX_FUNCTION_LINES}): ${text}`,
      );
    }
  }
  return problems;
}

// Key: offset of the opening brace/parenthesis. Value: start offset and a short heading.
function findHeaders({ content }) {
  const headers = new Map();
  for (const match of content.matchAll(HEADER)) {
    const head = match[0].trim();
    if (SKIP_WORDS.has(head.split(/[\s(]/)[0])) continue;
    const opener = match.index + match[0].length - 1;
    headers.set(opener, { start: match.index, text: head.split("\n")[0].slice(0, 60) });
  }
  return headers;
}

function lineStartOffsets({ content }) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") starts.push(i + 1);
  }
  return starts;
}

// Line number (0-based) for an offset, via binary search.
function lineOf({ starts, offset }) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// Offset of the matching closing brace. Skips strings, templates and comments.
export function findClose({ content, opener }) {
  let depth = 0;
  let i = opener;
  while (i < content.length) {
    const ch = content[i];
    const next = content[i + 1];
    if (ch === "/" && next === "/") {
      i = skipPast({ content, token: "\n", from: i });
    } else if (ch === "/" && next === "*") {
      i = skipPast({ content, token: "*/", from: i + 2 });
    } else if (ch === '"' || ch === "'") {
      i = skipQuoted({ content, from: i });
    } else if (ch === "`") {
      i = skipTemplate({ content, from: i });
    } else {
      if ("([{".includes(ch)) depth++;
      if (")]}".includes(ch)) depth--;
      if (depth === 0 && ")]}".includes(ch)) return i;
      i++;
    }
  }
  return -1;
}

function skipPast({ content, token, from }) {
  const idx = content.indexOf(token, from);
  return idx < 0 ? content.length : idx + token.length;
}

// Single/double quotes run at most to the end of the line, so an apostrophe in JSX text stays local.
function skipQuoted({ content, from }) {
  const quote = content[from];
  let i = from + 1;
  while (i < content.length && content[i] !== quote && content[i] !== "\n") {
    i += content[i] === "\\" ? 2 : 1;
  }
  return content[i] === quote ? i + 1 : i;
}

function skipTemplate({ content, from }) {
  let i = from + 1;
  while (i < content.length && content[i] !== "`") {
    i += content[i] === "\\" ? 2 : 1;
  }
  return i + 1;
}
