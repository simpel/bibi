import { appError, err, ok, type Result } from "@bibi/core";

export type ValidateKeyInput = { key: string };

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

/** Accepts `a/b/c` keys of safe segments; rejects absolute paths, `..`, empty segments and `\`. */
export function validateKey({ key }: ValidateKeyInput): Result<string> {
  const segments = key.split("/");
  const safe = segments.every(
    (segment) => segment !== "." && segment !== ".." && SAFE_SEGMENT.test(segment),
  );
  if (key.length === 0 || key.length > 512 || !safe) {
    return err({ error: appError({ code: "VALIDATION", message: "Invalid storage key" }) });
  }
  return ok({ value: key });
}
