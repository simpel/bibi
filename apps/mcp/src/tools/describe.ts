import type { AnyOperation } from "@bibi/core";

export type DescribeInput = { operation: AnyOperation };

/** LLM-facing description: what it does, who may call it, and what happens for the AI actor. */
export function describeOperation({ operation }: DescribeInput): string {
  const lines = [operation.description, `Required permission: ${operation.permission}.`];
  if (operation.kind === "query") lines.push("Read-only.");
  else if (operation.approval) {
    lines.push(
      "Changes data. When called by the AI assistant it is NOT executed: the result is " +
        "`status: approval_required` with a summary, and the user must approve it in the Bibi UI. " +
        "Do not retry or call it again; tell the user a proposal is waiting for approval.",
    );
  }
  return lines.join(" ");
}
