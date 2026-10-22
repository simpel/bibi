import {
  type AnyOperation,
  appError,
  type ExecuteContext,
  err,
  fromZodError,
  ok,
  type Result,
} from "@bibi/core";
import type { McpToolMeta } from "../tools/meta";

export type BindProposalInput = {
  meta: McpToolMeta | undefined;
  operation: AnyOperation;
  input: unknown;
  context: ExecuteContext;
};

const asRecord = ({ value }: { value: unknown }): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/**
 * Adds the tool's server-bound facts to a proposal before it is signed (#144), e.g. the ticket
 * count the approval card shows. The bound input is validated again, so the token only ever
 * carries input the operation accepts. A failed bind refuses the proposal.
 */
export async function bindProposal({
  meta,
  operation,
  input,
  context,
}: BindProposalInput): Promise<Result<unknown>> {
  if (!meta?.bind) return ok({ value: input });
  const record = asRecord({ value: input });
  if (!record)
    return err({ error: appError({ code: "VALIDATION", message: "Input must be an object" }) });
  const bound = await meta.bind({ input: record, context });
  if (!bound.ok) return bound;
  const parsed = operation.input.safeParse(bound.value);
  if (!parsed.success) return err({ error: fromZodError({ error: parsed.error }) });
  return ok({ value: parsed.data });
}
