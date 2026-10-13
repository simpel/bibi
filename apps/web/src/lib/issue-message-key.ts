/** Minimal Zod issue facts needed to pick a localized message. */
export type IssueFacts = {
  code?: string | undefined;
  origin?: string | undefined;
  format?: string | undefined;
  expected?: string | undefined;
  minimum?: number | bigint | undefined;
};

export type IssueMessageKey =
  | "required"
  | "invalidEmail"
  | "invalidNumber"
  | "tooLong"
  | "tooShort"
  | "textTooShort"
  | "tooBig"
  | "invalid";

const isEmptyCheck = ({ minimum }: Pick<IssueFacts, "minimum">) => Number(minimum ?? 1) <= 1;

/** Zod issue → `errors.*` key so field messages are localized instead of Zod's English text. */
export function issueMessageKey(facts: IssueFacts): IssueMessageKey {
  const { code, origin, format, expected } = facts;
  if (code === "invalid_format") return format === "email" ? "invalidEmail" : "invalid";
  if (code === "invalid_type") return expected === "number" ? "invalidNumber" : "required";
  if (code === "too_big") return origin === "string" ? "tooLong" : "tooBig";
  if (code !== "too_small") return "invalid";
  if (origin !== "string") return "tooShort";
  return isEmptyCheck(facts) ? "required" : "textTooShort";
}
