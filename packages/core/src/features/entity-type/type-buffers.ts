import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import type { EntityBase } from "./capability-kinds";

export type CheckTypeBuffersInput = {
  base: EntityBase;
  setupMinutes?: number | null;
  teardownMinutes?: number | null;
  /** Item types only: EQUIPMENT or PERSON (ADR 0059). */
  resourceKind?: string | null;
};

/**
 * Only item types have default buffers, which apply around their items' bookings, and the
 * Equipment or Person choice (ADR 0059).
 */
export function checkTypeBuffers({
  base,
  setupMinutes,
  teardownMinutes,
  resourceKind,
}: CheckTypeBuffersInput): Result<true> {
  if (base === "ITEM") return ok({ value: true });
  const message = "Only item types have setup and teardown minutes or a resource kind";
  const paths = [
    ...(setupMinutes != null ? ["setupMinutes"] : []),
    ...(teardownMinutes != null ? ["teardownMinutes"] : []),
    ...(resourceKind != null ? ["resourceKind"] : []),
  ];
  if (paths.length === 0) return ok({ value: true });
  return invalid({ message, issues: paths.map((path) => ({ path, message })) });
}
