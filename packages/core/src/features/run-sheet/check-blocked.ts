import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import type { RunSheetDto } from "./schema";

export type CheckNotBlockedInput = {
  runSheet: Pick<RunSheetDto, "blocked" | "matches" | "version">;
};

/** A run sheet with a blocking match (an item contains a counted value) cannot be sent. */
export function checkNotBlocked({ runSheet }: CheckNotBlockedInput): Result<true> {
  if (!runSheet.blocked) return ok({ value: true });
  const hits = runSheet.matches
    .filter((match) => match.blocking)
    .map((match) => `${match.name} in ${match.lineName}`);
  return conflict({
    message: `Version ${runSheet.version} is blocked: ${hits.join(", ")} (see the run sheet's matches)`,
  });
}
