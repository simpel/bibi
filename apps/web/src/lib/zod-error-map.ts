import { type IssueFacts, type IssueMessageKey, issueMessageKey } from "./issue-message-key";

export type ZodMessageMapInput = { translate: (key: IssueMessageKey) => string };

/** Zod `error` map for parsing: yields localized messages (pass to `zodResolver` options). */
export function zodMessageMap({ translate }: ZodMessageMapInput) {
  return (issue: IssueFacts): string => translate(issueMessageKey(issue));
}
