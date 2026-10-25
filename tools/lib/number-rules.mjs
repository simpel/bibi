// Number rule (#482): numbers and amounts are written only through `createNumberFormat`, so the
// user's number format and currency display apply everywhere. Outside the number module, raw
// `Intl.NumberFormat`, currency styles, `toLocaleString` and next-intl's `format.number(value, …)`
// are errors.

// The number module: core's formatter and the web app's thin wrappers around it.
const NUMBER_MODULE = /^(packages\/core\/src\/number|apps\/web\/src\/lib\/number)\//;
// Tests and stories need fixed output.
const EXEMPT = /\.(test|stories)\.tsx?$|(^|\/)test\/|(^|\/)stories\//;

const INTL_NUMBER = /\bIntl\.NumberFormat\b/;
const CURRENCY_STYLE = /\bstyle:\s*["'`]currency["'`]/;
const LOCALE_STRING = /\.toLocaleString\(/;
// next-intl takes the value first; the user's formatter takes one object (`number({ value })`).
const INTL_FORMAT = /\.number\(\s*(?!\{)[^\s)]/g;

const RULES = [
  { pattern: INTL_NUMBER, message: "`Intl.NumberFormat`" },
  { pattern: CURRENCY_STYLE, message: "currency number style" },
  { pattern: LOCALE_STRING, message: "`toLocaleString`" },
];

function stripComments({ content }) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

/** next-intl number formatting, also when the value is on the next line. */
function intlFormatProblems({ code }) {
  return [...code.matchAll(INTL_FORMAT)].map(({ index }) => {
    const line = code.slice(0, index).split("\n").length;
    return `line ${line}: next-intl number formatting outside the number module (use useNumberFormat or getNumberFormat, #482)`;
  });
}

/** Problems for one file; each says to use the number module (#482). */
export function checkNumber({ relPath, content }) {
  if (NUMBER_MODULE.test(relPath) || EXEMPT.test(relPath)) return [];
  const code = stripComments({ content });
  const problems = [];
  code.split("\n").forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        problems.push(`line ${index + 1}: ${rule.message} outside the number module (#482)`);
      }
    }
  });
  return [...problems, ...intlFormatProblems({ code })];
}
