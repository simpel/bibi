import "server-only";
import type { Result } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";

export type ToActionResultInput<T> = { result: Result<T> };

/** Converts a core Result into the serializable shape server actions return. */
export function toActionResult<T>({ result }: ToActionResultInput<T>): ActionResult<T> {
  if (result.ok) return { ok: true, value: result.value };
  const { code, message, issues } = result.error;
  return { ok: false, error: { code, message, issues } };
}
