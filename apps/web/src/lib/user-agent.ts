/** A browser and operating system read from a `User-Agent` header, e.g. Chrome on macOS. */
export type DeviceName = { browser: string | null; os: string | null };

/** Order matters: Edge and Opera also say Chrome, Chrome also says Safari. */
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

/** Order matters: iOS and Android also mention Mac OS X and Linux. */
const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

const firstMatch = ({ value, rules }: { value: string; rules: [RegExp, string][] }) =>
  rules.find(([pattern]) => pattern.test(value))?.[1] ?? null;

export type DescribeUserAgentInput = { userAgent: string | null | undefined };

/** The browser and system of a user agent; both `null` when it names neither. */
export function describeUserAgent({ userAgent }: DescribeUserAgentInput): DeviceName {
  const value = userAgent ?? "";
  return {
    browser: firstMatch({ value, rules: BROWSERS }),
    os: firstMatch({ value, rules: SYSTEMS }),
  };
}
