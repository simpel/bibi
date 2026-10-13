/** Minimal Zod issue facts needed to pick a localized message. */
export type IssueFacts = { code: string; origin?: string | undefined; format?: string | undefined };

export type IssueMessageKey =
  | "required"
  | "invalidEmail"
  | "invalidNumber"
  | "tooLong"
  | "tooShort"
  | "tooBig"
  | "invalid";

/** Zod issue → `errors.*` key so field messages are localized instead of Zod's English text. */
export function issueMessageKey({ code, origin, format }: IssueFacts): IssueMessageKey {
  if (code === "invalid_format") return format === "email" ? "invalidEmail" : "invalid";
  if (code === "invalid_type") return origin === "number" ? "invalidNumber" : "required";
  if (code === "too_big") return origin === "string" ? "tooLong" : "tooBig";
  if (code === "too_small") return origin === "string" ? "required" : "tooShort";
  return "invalid";
}
