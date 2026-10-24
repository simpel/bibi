// Time rule (ADR 0064): only the time module converts between instants, wall-clock time and zones.
// Outside it, local-time Date getters and setters, `new Date(y, m, d)`, hard-coded IANA zone names
// and `format.relativeTime` are errors. UTC getters are fine: they do not read a zone.

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

const RULES = [
  { pattern: LOCAL_ACCESSOR, message: "local-time Date getter or setter" },
  { pattern: RAW_DATE, message: "`new Date(y, m, d)` reads the host zone" },
  { pattern: ZONE_NAME, message: "hard-coded time zone name", zoneRule: true },
  { pattern: RELATIVE_TIME, message: "`format.relativeTime`" },
];

function stripComments({ content }) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

/** Problems for one file; each says to use the time module (ADR 0064). */
export function checkTime({ relPath, content }) {
  if (TIME_MODULE.test(relPath) || EXEMPT.test(relPath)) return [];
  const lines = stripComments({ content }).split("\n");
  const problems = [];
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.zoneRule && ZONE_DATA.test(relPath)) continue;
      if (rule.pattern.test(line)) {
        problems.push(`line ${index + 1}: ${rule.message} outside the time module (ADR 0064)`);
      }
    }
  });
  return problems;
}
