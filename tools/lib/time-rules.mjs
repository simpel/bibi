// Time rule (ADR 0064): only the time module converts between instants, wall-clock time and zones.
// Outside it, local-time Date getters and setters, `new Date(y, m, d)`, hard-coded IANA zone names
// and `format.relativeTime` are errors. UTC getters are fine: they do not read a zone.
// Dates and times are written only through `createDateTimeFormat` (#481, ADR 0046): next-intl's
// `format.dateTime(value, …)`/`dateTimeRange(…)` and `toLocaleDateString`/`toLocaleTimeString`
// ignore the user's date and clock format.

// The time module: core's conversions and the web app's thin wrappers around next-intl.
const TIME_MODULE = /^(packages\/core\/src\/time|apps\/web\/src\/lib\/time)\//;
// Tests and stories need fixed instants and zone names.
const EXEMPT = /\.(test|stories)\.tsx?$|(^|\/)test\/|(^|\/)stories\//;
// Demo organizations choose their zones as data, like a real organization does (ADR 0064).
const ZONE_DATA = /^packages\/core\/src\/seed\/demo\/data\//;

const LOCAL_ACCESSOR =
  /\.(?:get|set)(?:FullYear|Month|Date|Day|Hours|Minutes|Seconds|Milliseconds)\(/;
const RAW_DATE = /\bnew Date\(\s*[^()]*,/;
const ZONE_NAME =
  /["'`](?:Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_]+/;
const RELATIVE_TIME = /\.relativeTime\(/;
const LOCALE_DATE = /\.toLocale(?:Date|Time)String\(/;
// next-intl takes the value first; the user's formatter takes one object (`format.date({ … })`).
const INTL_FORMAT = /\.dateTime(?:Range)?\(\s*(?!\{)[^\s)]/g;

const RULES = [
  { pattern: LOCAL_ACCESSOR, message: "local-time Date getter or setter" },
  { pattern: RAW_DATE, message: "`new Date(y, m, d)` reads the host zone" },
  { pattern: ZONE_NAME, message: "hard-coded time zone name", zoneRule: true },
  { pattern: RELATIVE_TIME, message: "`format.relativeTime`" },
  { pattern: LOCALE_DATE, message: "`toLocaleDateString`/`toLocaleTimeString`" },
];

/** next-intl date formatting, also when the value is on the next line. */
function intlFormatProblems({ code }) {
  return [...code.matchAll(INTL_FORMAT)].map(({ index }) => {
    const line = code.slice(0, index).split("\n").length;
    return `line ${line}: next-intl date formatting outside the time module (use useDateTimeFormat or getDateTimeFormat, #481)`;
  });
}

function stripComments({ content }) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

/** Problems for one file; each says to use the time module (ADR 0064). */
export function checkTime({ relPath, content }) {
  if (TIME_MODULE.test(relPath) || EXEMPT.test(relPath)) return [];
  const code = stripComments({ content });
  const lines = code.split("\n");
  const problems = [];
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.zoneRule && ZONE_DATA.test(relPath)) continue;
      if (rule.pattern.test(line)) {
        problems.push(`line ${index + 1}: ${rule.message} outside the time module (ADR 0064)`);
      }
    }
  });
  return [...problems, ...intlFormatProblems({ code })];
}
