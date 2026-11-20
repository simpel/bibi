import { type AnyOperation, appError, err, fromZodError, ok, type Result } from "@bibi/core";
import { z } from "zod";

/** A value the user changed on the approval card: one top-level field, a plain value. */
export const ApprovalEditsSchema = z
  .record(z.string().min(1).max(100), z.union([z.string().max(10_000), z.number(), z.boolean()]))
  .refine((edits) => Object.keys(edits).length <= 50, { message: "Too many edits" });

export type ApprovalEdits = z.infer<typeof ApprovalEditsSchema>;

export type ApplyEditsInput = {
  operation: AnyOperation;
  input: unknown;
  edits: ApprovalEdits | undefined;
};

/** References are never edited on the card: the proposal stays about the same records. */
const isReference = ({ key }: { key: string }): boolean =>
  key === "id" || key.endsWith("Id") || key.endsWith("Ids");

const refuse = ({ message }: { message: string }) =>
  err({ error: appError({ code: "VALIDATION", message }) });

/**
 * The signed input with the user's edits on top, validated by the operation again. An edit on a
 * reference or on a field the operation does not take is refused, never dropped silently.
 */
export function applyEdits({ operation, input, edits }: ApplyEditsInput): Result<unknown> {
  if (!edits || Object.keys(edits).length === 0) return ok({ value: input });
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return refuse({ message: "This proposal cannot be edited" });
  const keys = Object.keys(edits);
  const reference = keys.find((key) => isReference({ key }));
  if (reference) return refuse({ message: `Field ${reference} cannot be edited` });
  const parsed = operation.input.safeParse({ ...input, ...edits });
  if (!parsed.success) return err({ error: fromZodError({ error: parsed.error }) });
  const value = parsed.data as Record<string, unknown>;
  const unknown = keys.find((key) => !(key in value));
  if (unknown) return refuse({ message: `Field ${unknown} cannot be edited` });
  return ok({ value });
}
