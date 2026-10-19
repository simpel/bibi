import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import { STEP_REFERENCE } from "./schema";

type Json = unknown;

/** The value at a dot path, or `undefined` when any part is missing. */
function valueAt({ value, path }: { value: Json; path: string }): Json {
  return path.split(".").reduce<Json>((current, key) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, Json>)[key];
  }, value);
}

type WalkInput = { value: Json; outputs: readonly Json[]; missing: string[] };

function walk({ value, outputs, missing }: WalkInput): Json {
  if (typeof value === "string") {
    const match = STEP_REFERENCE.exec(value);
    if (!match) return value;
    const [, index, path] = match;
    const found = valueAt({ value: outputs[Number(index)], path: path ?? "" });
    if (found === undefined) missing.push(value);
    return found;
  }
  if (Array.isArray(value)) return value.map((item) => walk({ value: item, outputs, missing }));
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([key, item]) => [
      key,
      walk({ value: item, outputs, missing }),
    ]);
    return Object.fromEntries(entries);
  }
  return value;
}

export type ResolveReferencesInput = {
  input: Record<string, Json>;
  /** Outputs of the steps before this one, in order. */
  outputs: readonly Json[];
  step: number;
};

/** The step's input with every `$step:` reference replaced; an unknown one is a VALIDATION error. */
export function resolveReferences({ input, outputs, step }: ResolveReferencesInput): Result<Json> {
  const missing: string[] = [];
  const value = walk({ value: input, outputs, missing });
  if (missing.length === 0) return ok({ value });
  const issues = missing.map((reference) => ({
    path: `steps.${step}.input`,
    message: `${reference} does not name the output of an earlier step`,
  }));
  return invalid({ message: "Unknown step reference", issues });
}
