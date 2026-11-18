import type { MyWorkFlag } from "@bibi/core/schemas";

type Leveled = Pick<MyWorkFlag, "kind" | "runSheetStatus">;

/** A clash or a blocked run sheet blocks the order: an error. The rest need fixing: a warning. */
export const flagLevel = ({ flag }: { flag: Leveled }): "error" | "warning" =>
  flag.kind === "HARD_CLASH" || flag.runSheetStatus === "BLOCKED" ? "error" : "warning";

/** What a card's flags ask for as a whole: red if any blocks, amber if any needs fixing. */
export const flagAttention = ({ flags }: { flags: readonly Leveled[] }) => {
  if (flags.length === 0) return null;
  return flags.some((flag) => flagLevel({ flag }) === "error") ? "error" : "warning";
};
