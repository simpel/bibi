import { AppError } from "../../errors/app-error";
import { err, type Result } from "../../errors/result";

export type AtPathInput<T> = { result: Result<T>; path: string };

/**
 * The result with its error's issues moved under `path` (`itemId` → `lines.2.itemId`), so a
 * check made for one record names the part of a larger input it came from. An error without
 * issues gets one at `path`.
 */
export function atPath<T>({ result, path }: AtPathInput<T>): Result<T> {
  if (result.ok) return result;
  const { code, message, issues } = result.error;
  const moved =
    issues.length > 0
      ? issues.map((issue) => ({ path: `${path}.${issue.path}`, message: issue.message }))
      : [{ path, message }];
  return err({ error: new AppError({ code, message, issues: moved, cause: result.error }) });
}
