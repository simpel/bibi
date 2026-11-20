// Icon button rule: every icon-only button says what a click does. `Button size="icon"` (and the
// chat's icon-only buttons) shows its `aria-label` as a tooltip, so each one needs an
// `aria-label`, a `tooltip` text or `tooltip={false}` (another tooltip covers it), or spreads the
// caller's props (a wrapper whose callers give the label).

const EXEMPT = /\.(test|stories)\.tsx?$|(^|\/)test\/|(^|\/)stories\//;

/** Components that are icon-only whatever their size. */
const ICON_ONLY = new Set(["PromptInputSubmit", "PromptInputButton", "ConversationScrollButton"]);

/** The opening tag starting at `start` (`<Name ...>`), braces and strings skipped. */
function openingTag({ code, start }) {
  let depth = 0;
  let quote = null;
  for (let index = start + 1; index < code.length; index += 1) {
    const char = code[index];
    if (quote) {
      if (char === quote && code[index - 1] !== "\\") quote = null;
    } else if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
    else if (char === ">" && depth === 0) return code.slice(start, index + 1);
  }
  return code.slice(start);
}

/** The tag's own attributes, with each `{…}` expression emptied except a spread's `{...`. */
function topLevel({ tag }) {
  let depth = 0;
  let out = "";
  for (let index = 0; index < tag.length; index += 1) {
    const char = tag[index];
    if (char === "{") {
      if (depth === 0) out += /^\{\s*\.\.\./.test(tag.slice(index)) ? "{..." : "{";
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) out += "}";
    } else if (depth === 0) out += char;
  }
  return out;
}

/** Problems for one file: icon buttons that would have no tooltip. */
export function checkIconButtons({ relPath, content }) {
  if (!relPath.endsWith(".tsx") || EXEMPT.test(relPath)) return [];
  const problems = [];
  for (const match of content.matchAll(/<([A-Z]\w*)\b/g)) {
    const name = match[1];
    const tag = openingTag({ code: content, start: match.index });
    const own = topLevel({ tag });
    const icon =
      ICON_ONLY.has(name) || (name === "Button" && /\bsize=(\{\s*)?["']icon["']/.test(tag));
    if (!icon) continue;
    if (/\baria-label=|\btooltip=|\{\s*\.\.\./.test(own)) continue;
    const line = content.slice(0, match.index).split("\n").length;
    problems.push(
      `line ${line}: icon button <${name}> without aria-label (its tooltip says what a click does)`,
    );
  }
  return problems;
}
