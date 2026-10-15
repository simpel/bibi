import { z } from "zod";
import { type RecurrenceRule, RecurrenceRuleSchema } from "./recurrence-rule-schema";

const PART_TO_FIELD = {
  FREQ: "freq",
  INTERVAL: "interval",
  BYDAY: "byDay",
  BYMONTHDAY: "byMonthDay",
  COUNT: "count",
  UNTIL: "until",
} as const;

type PartName = keyof typeof PART_TO_FIELD;

function toPartName({ name }: { name: string }): PartName | null {
  return Object.hasOwn(PART_TO_FIELD, name) ? (name as PartName) : null;
}

function toNumber({ value }: { value: string }): number {
  return /^\d+$/.test(value) ? Number(value) : Number.NaN;
}

const UNTIL_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;

/** `20261231` → `2026-12-31`, which the schema then checks is a real date. */
function toIsoDate({ value }: { value: string }): string {
  return value.replace(UNTIL_PATTERN, "$1-$2-$3");
}

function partProblem({
  name,
  value,
  rest,
}: {
  name: string;
  value?: string;
  rest: string[];
}): string | null {
  if (value === undefined || value === "" || rest.length > 0) return `Invalid ${name} part`;
  if (name === "UNTIL" && !UNTIL_PATTERN.test(value)) return "UNTIL must be a date, YYYYMMDD";
  return null;
}

function toFieldValue({ name, value }: { name: PartName; value: string }): unknown {
  if (name === "INTERVAL" || name === "COUNT") return toNumber({ value });
  if (name === "BYDAY") return value.split(",");
  if (name === "BYMONTHDAY") return value.split(",").map((day) => toNumber({ value: day }));
  if (name === "UNTIL") return toIsoDate({ value });
  return value;
}

function toRawRule({ rrule, ctx }: { rrule: string; ctx: z.RefinementCtx }): unknown {
  const raw: Record<string, unknown> = {};
  const body = rrule
    .trim()
    .toUpperCase()
    .replace(/^RRULE:/, "");
  for (const part of body.split(";").filter(Boolean)) {
    const [rawName = "", value, ...rest] = part.split("=");
    const name = toPartName({ name: rawName });
    if (!name) {
      ctx.addIssue({ code: "custom", path: [], message: `Unsupported rule part ${rawName}` });
      continue;
    }
    const field = PART_TO_FIELD[name];
    const problem = field in raw ? `Repeated ${name} part` : partProblem({ name, value, rest });
    if (problem || value === undefined) {
      ctx.addIssue({ code: "custom", path: [field], message: problem ?? `Invalid ${name} part` });
      continue;
    }
    raw[field] = toFieldValue({ name, value });
  }
  return raw;
}

function toRule({ rrule, ctx }: { rrule: string; ctx: z.RefinementCtx }): RecurrenceRule {
  const parsed = RecurrenceRuleSchema.safeParse(toRawRule({ rrule, ctx }));
  if (parsed.success) return parsed.data;
  for (const issue of parsed.error.issues) {
    ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
  }
  return z.NEVER;
}

/**
 * An RRULE string such as `FREQ=MONTHLY;BYDAY=1TU;COUNT=10`, parsed into a `RecurrenceRule`.
 * Problems in the string and in the rule are reported together, one issue per field.
 */
export const RruleStringSchema = z
  .string()
  .transform((rrule, ctx) => toRule({ rrule, ctx }))
  .describe("RRULE subset: FREQ=WEEKLY|MONTHLY, INTERVAL, BYDAY, BYMONTHDAY, COUNT or UNTIL");

/** `RecurrenceRule` → RRULE string. `parse(serialize(rule))` gives back the same rule. */
export function serializeRecurrenceRule({ rule }: { rule: RecurrenceRule }): string {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.interval !== 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.byDay) parts.push(`BYDAY=${rule.byDay.join(",")}`);
  if (rule.byMonthDay) parts.push(`BYMONTHDAY=${rule.byMonthDay.join(",")}`);
  if (rule.count !== undefined) parts.push(`COUNT=${rule.count}`);
  if (rule.until) parts.push(`UNTIL=${rule.until.replaceAll("-", "")}`);
  return parts.join(";");
}
