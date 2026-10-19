import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import type { SheetDto } from "./schema";

export type CheckNotBlockedInput = { sheet: Pick<SheetDto, "blocked" | "matches" | "version"> };

/** A sheet with a blocking match (an item contains a counted value) cannot be sent. */
export function checkNotBlocked({ sheet }: CheckNotBlockedInput): Result<true> {
  if (!sheet.blocked) return ok({ value: true });
  const hits = sheet.matches
    .filter((match) => match.blocking)
    .map((match) => `${match.name} in ${match.lineName}`);
  return conflict({
    message: `Version ${sheet.version} is blocked: ${hits.join(", ")} (see the sheet's matches)`,
  });
}
