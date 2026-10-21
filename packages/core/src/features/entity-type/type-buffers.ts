import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import type { EntityBase } from "./capability-kinds";

export type CheckTypeBuffersInput = {
  base: EntityBase;
  setupMinutes?: number | null;
  teardownMinutes?: number | null;
};

/** Only item types have default buffers (ADR 0059): they apply around their items' bookings. */
export function checkTypeBuffers({
  base,
  setupMinutes,
  teardownMinutes,
}: CheckTypeBuffersInput): Result<true> {
  if (base === "ITEM") return ok({ value: true });
  const message = "Only item types have setup and teardown minutes";
  const paths = [
    ...(setupMinutes != null ? ["setupMinutes"] : []),
    ...(teardownMinutes != null ? ["teardownMinutes"] : []),
  ];
  if (paths.length === 0) return ok({ value: true });
  return invalid({ message, issues: paths.map((path) => ({ path, message })) });
}
