import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { loadElements } from "./element-rows";
import type { FloorElementDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** The plan an item gets before anything is saved: a 10 × 8 m rectangle. */
export const DEFAULT_PLAN = { widthCm: 1000, depthCm: 800 } as const;

export const rectangle = ({ widthCm, depthCm }: { widthCm: number; depthCm: number }) => [
  [0, 0] as [number, number],
  [widthCm, 0] as [number, number],
  [widthCm, depthCm] as [number, number],
  [0, depthCm] as [number, number],
];

/** An active item whose type has `SETUPS`; anything else reads as not found or invalid. */
export async function checkSetupsItem({
  context,
  itemId,
}: Db & { itemId: string }): Promise<Result<true>> {
  const item = await context.db.item.findFirst({
    where: { id: itemId },
    select: { entityType: { select: { capabilities: true } } },
  });
  if (!item) return notFound({ entity: "Item" });
  if (!item.entityType.capabilities.includes("SETUPS")) {
    const message = "The item's type has no setups";
    return invalid({ message, issues: [{ path: "itemId", message }] });
  }
  return ok({ value: true });
}

export type PlanState = {
  id: string | null;
  version: number;
  widthCm: number;
  depthCm: number;
  outline: [number, number][];
  minAisleCm: number | null;
  elements: FloorElementDto[];
};

/** The stored outline, or null when it is not a list of at least three [x, y] points. */
function readOutline({ value }: { value: unknown }): [number, number][] | null {
  if (!Array.isArray(value)) return null;
  const points = value.filter(
    (point): point is [number, number] =>
      Array.isArray(point) && point.length === 2 && point.every(Number.isFinite),
  );
  return points.length === value.length && points.length >= 3 ? points : null;
}

/** The item's saved plan with its fixed elements, or the default rectangle (version 0). */
export async function loadPlanState({
  context,
  itemId,
}: Db & { itemId: string }): Promise<PlanState> {
  const plan = await context.db.floorPlan.findFirst({ where: { itemId } });
  if (!plan) {
    return {
      id: null,
      version: 0,
      ...DEFAULT_PLAN,
      outline: rectangle(DEFAULT_PLAN),
      minAisleCm: null,
      elements: [],
    };
  }
  const { id, version, widthCm, depthCm, minAisleCm } = plan;
  const outline = readOutline({ value: plan.outline }) ?? rectangle(plan);
  const elements = await loadElements({ context, parent: { floorPlanId: id } });
  return { id, version, widthCm, depthCm, outline, minAisleCm, elements };
}

/** `CONFLICT` when someone saved after the caller loaded (optimistic concurrency, ADR 0099). */
export function checkVersion({
  expected,
  current,
}: {
  expected: number;
  current: number;
}): Result<true> {
  if (expected === current) return ok({ value: true });
  const message = `Someone saved this after you opened it (version ${current}, you had ${expected})`;
  return conflict({ message, issues: [{ path: "expectedVersion", message }] });
}

/** `CONFLICT` for a save that lost to a concurrent save of the same version. */
export const raceLost = () => {
  const message = "Someone saved this at the same time";
  return conflict({ message, issues: [{ path: "expectedVersion", message }] });
};
