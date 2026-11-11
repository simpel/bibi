import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import {
  importFloorElementKinds,
  listFloorElementKinds,
} from "../../features/floor-plan/kind-operations";
import { createLayout, saveLayout } from "../../features/floor-plan/layout-operations";
import { saveFloorPlan } from "../../features/floor-plan/plan-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoConfig, DemoFloorPiece, DemoLayout } from "./config-types";
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
  emergencyExit: boolean;
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
      emergencyExit: piece.emergencyExit ?? false,
    });
  }
  return ok({ value: elements });
}

type Created = Map<string, { id: string; version: number }>;

const keyOf = ({ itemId, name }: { itemId: string; name: string }) => `${itemId} ${name}`;

/** ADR 0103: every room's layouts with their typed capacity and the name's setup minutes. */
async function seedItemLayouts({
  context,
  config,
  catalog,
}: Omit<SeedFloorPlansInput, "refs">): Promise<Result<Created>> {
  const created: Created = new Map();
  for (const item of config.items) {
    const itemId = catalog.items.get(item.name);
    if (!itemId) continue;
    for (const [name, capacity] of Object.entries(item.layouts ?? {})) {
      const input = { itemId, name, capacity, setupMinutes: config.layoutMinutes[name] ?? null };
      const layout = await execute({ operation: createLayout, input, context });
      if (!layout.ok) return layout;
      created.set(keyOf({ itemId, name }), layout.value);
    }
  }
  return ok({ value: created });
}

type DrawInput = {
  context: ExecuteContext;
  itemId: string;
  layout: DemoLayout;
  kinds: ReadonlyMap<string, string>;
  created: Created;
  minutes: Readonly<Record<string, number>>;
};

/** Draws a demo layout into the room's layout of that name, created when it is new. */
async function drawLayout({ context, itemId, layout, kinds, created, minutes }: DrawInput) {
  const elements = toElements({ pieces: layout.pieces, kinds });
  if (!elements.ok) return elements;
  const existing = created.get(keyOf({ itemId, name: layout.name }));
  const target = existing
    ? ok({ value: existing })
    : await execute({
        operation: createLayout,
        input: { itemId, name: layout.name, setupMinutes: minutes[layout.name] ?? null },
        context,
      });
  if (!target.ok) return target;
  const capacity = layout.useSeats ? { capacity: null } : {};
  const { id, version } = target.value;
  const input = { id, expectedVersion: version, ...capacity, elements: elements.value };
  return execute({ operation: saveLayout, input, context });
}

/**
 * ADR 0099, 0102, 0103: every room's layouts, the starter furniture library and the drawn rooms,
 * through `layout.create`, `floorPlan.save` and `layout.save` as SYSTEM.
 */
export async function seedDemoFloorPlans({
  context,
  config,
  catalog,
}: SeedFloorPlansInput): Promise<Result<true>> {
  const created = await seedItemLayouts({ context, config, catalog });
  if (!created.ok) return created;
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
      ...{ itemId, expectedVersion: 0, widthCm, depthCm, outline },
      ...{ minAisleCm: null, elements: fixed.value },
    };
    const saved = await execute({ operation: saveFloorPlan, input, context });
    if (!saved.ok) return saved;
    for (const layout of plan.layouts) {
      const minutes = config.layoutMinutes;
      const drawn = await drawLayout({
        context,
        itemId,
        layout,
        kinds,
        created: created.value,
        minutes,
      });
      if (!drawn.ok) return drawn;
    }
  }
  return ok({ value: true });
}
