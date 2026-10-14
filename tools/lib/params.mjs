// Parameterregel: funktioner, metoder och namngivna const-pilfunktioner tar EN typad objektparameter,
// t.ex. fn({ a, b }: FnInput). React-komponenter (versal namn) får ta ett enda `props`-argument.
// Inline-callbacks (.map((x) => ...), händelsehanterare) granskas inte.
import { findClose } from "./functions.mjs";

const HEADER = new RegExp(
  [
    String.raw`\bfunction\b\s*\*?\s*(\w*)\s*(?:<(?:[^<>\n]|<[^<>\n]*>)*>)?\s*\(`,
    String.raw`\b(?:const|let)\s+(\w+)\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:<(?:[^<>\n]|<[^<>\n]*>)*>\s*)?\(`,
    String.raw`^[ \t]+(?:(?:public|private|protected|static|override|async)\s+)*(\w+)\s*(?:<(?:[^<>\n]|<[^<>\n]*>)*>)?\s*\(`,
  ].join("|"),
  "gm",
);
// Kontrollsatser och nyckelord som ser ut som metodanrop med block.
const SKIP_NAMES = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "with",
  "return",
  "typeof",
  "await",
  "new",
  "super",
  "function",
]);
const HTTP_VERBS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const BODY_AFTER = /^\s*(?::[^{;]*)?\{/;
const ARROW_AFTER = /^\s*(?::[^=;{]*)?=>/;

export function analyzeParams({ relPath, content }) {
  const problems = [];
  for (const match of content.matchAll(HEADER)) {
    const name = match[1] ?? match[2] ?? match[3];
    if (!name || SKIP_NAMES.has(name) || isExempt({ relPath, name })) continue;
    const open = match.index + match[0].length - 1;
    const close = findClose({ content, opener: open });
    if (close < 0) continue;
    const isArrow = match[2] !== undefined;
    const after = content.slice(close + 1, close + 300);
    if (!(isArrow ? ARROW_AFTER : BODY_AFTER).test(after)) continue;
    const reason = paramViolation({
      name,
      params: splitParams({ text: content.slice(open + 1, close) }),
    });
    if (reason) {
      const line = content.slice(0, match.index).split("\n").length;
      problems.push(`${name} (rad ${line}): ${reason}`);
    }
  }
  return problems;
}

// Undantag: stories, Next route handlers (GET(request, context)), Next onRequestError(error,
// request, context) i instrumentation.ts och cn(...inputs) i packages/ui.
function isExempt({ relPath, name }) {
  if (/\.stories\.tsx$/.test(relPath)) return true;
  if (/(^|\/)route\.ts$/.test(relPath) && HTTP_VERBS.has(name)) return true;
  if (/(^|\/)instrumentation\.ts$/.test(relPath) && name === "onRequestError") return true;
  return name === "cn" && relPath.startsWith("packages/ui/");
}

export function paramViolation({ name, params }) {
  if (params.length === 0) return null;
  if (params.length > 1) {
    return `${params.length} parametrar (en enda typad objektparameter krävs)`;
  }
  const [param] = params;
  if (param.startsWith("{")) return null;
  if (/^[A-Z]/.test(name) && /^props\b/.test(param)) return null;
  return `positionell parameter "${param.slice(0, 40)}" (använd ett objekt: fn({ ... }: Input))`;
}

// Delar upp parameterlistan på toppnivåkomman. Hoppar över komman inne i <>, (), [] och {}.
export function splitParams({ text }) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isArrowGt = ch === ">" && text[i - 1] === "=";
    if (!isArrowGt && "([{<".includes(ch)) depth++;
    if (!isArrowGt && ")]}>".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}
