import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import {
  importFloorElementKinds,
  listFloorElementKinds,
} from "../../features/floor-plan/kind-operations";
import { createSetupLayout, saveSetupLayout } from "../../features/floor-plan/layout-operations";
import { saveFloorPlan } from "../../features/floor-plan/plan-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoConfig, DemoFloorPiece } from "./config-types";
import type { DemoRefs } from "./demo-refs";
import type { DemoCatalog } from "./seed-items";

export type SeedFloorPlansInput = {
  context: ExecuteContext;
  config: DemoConfig;
  refs: DemoRefs;
  catalog: DemoCatalog;
};

const missing = ({ what }: { what: string }) =>
  err({ error: new AppError({ code: "INTERNAL", message: `Demo floor plan: unknown ${what}` }) });

type PiecesInput = { pieces: readonly DemoFloorPiece[]; kinds: ReadonlyMap<string, string> };

type SeedElement = {
  kindId: string;
  xCm: number;
  yCm: number;
  rotationDeg: number;
  label: string | null;
  seatsTop: number | null;
  seatsBottom: number | null;
};

function toElements({ pieces, kinds }: PiecesInput): Result<SeedElement[]> {
  const elements: SeedElement[] = [];
  for (const piece of pieces) {
    const kindId = kinds.get(piece.kind);
    if (!kindId) return missing({ what: `kind ${piece.kind}` });
    elements.push({
      kindId,
      xCm: piece.x,
      yCm: piece.y,
      rotationDeg: piece.rotation ?? 0,
      label: piece.label ?? null,
      seatsTop: piece.seatsTop ?? null,
      seatsBottom: piece.seatsBottom ?? null,
    });
  }
  return ok({ value: elements });
}

/**
 * ADR 0099, 0102: the starter furniture library and the org's drawn rooms, through
 * `floorPlan.save`, `setupLayout.create` and `setupLayout.save` as SYSTEM.
 */
export async function seedDemoFloorPlans({
  context,
  config,
  refs,
  catalog,
}: SeedFloorPlansInput): Promise<Result<true>> {
  if (!config.floorPlans?.length) return ok({ value: true });
  const template = { template: "conference-banquet" as const };
  const imported = await execute({ operation: importFloorElementKinds, input: template, context });
  if (!imported.ok) return imported;
  const listed = await execute({
    operation: listFloorElementKinds,
    input: { limit: 100 },
    context,
  });
  if (!listed.ok) return listed;
  const kinds = new Map(listed.value.items.map((kind) => [kind.name, kind.id]));
  for (const plan of config.floorPlans) {
    const itemId = catalog.items.get(plan.item);
    if (!itemId) return missing({ what: `item ${plan.item}` });
    const fixed = toElements({ pieces: plan.fixed, kinds });
    if (!fixed.ok) return fixed;
    const { widthCm, depthCm } = plan;
    const outline: [number, number][] = plan.outline?.map(([x, y]) => [x, y]) ?? [
      [0, 0],
      [widthCm, 0],
      [widthCm, depthCm],
      [0, depthCm],
    ];
    const input = {
      itemId,
      expectedVersion: 0,
      widthCm,
      depthCm,
      outline,
      minAisleCm: null,
      elements: fixed.value,
    };
    const saved = await execute({ operation: saveFloorPlan, input, context });
    if (!saved.ok) return saved;
    for (const layout of plan.layouts) {
      const setupId = refs.setups.get(layout.setup);
      if (!setupId) return missing({ what: `setup ${layout.setup}` });
      const elements = toElements({ pieces: layout.pieces, kinds });
      if (!elements.ok) return elements;
      const created = await execute({
        operation: createSetupLayout,
        input: { itemId, setupId, name: layout.name },
        context,
      });
      if (!created.ok) return created;
      const capacity = layout.useSeats ? { capacity: null } : {};
      const { id, version } = created.value;
      const input = { id, expectedVersion: version, ...capacity, elements: elements.value };
      const drawn = await execute({ operation: saveSetupLayout, input, context });
      if (!drawn.ok) return drawn;
    }
  }
  return ok({ value: true });
}
