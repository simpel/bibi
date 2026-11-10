import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { ELEMENT_INCLUDE, loadElements, toElementDto, toPlaced } from "./element-rows";
import { layoutIssues } from "./layout-issues";
import type { LayoutSummaryDto, SetupLayoutDto } from "./layout-schema";
import { effectiveCapacity, layoutKey, loadLayoutSeats } from "./layout-seats";
import { checkSetupsItem, loadPlanState } from "./plan-load";

type Db = { context: Pick<OperationContext, "db"> };

/** The item's setup row; a setup the item lacks reads as not found. */
export async function loadItemSetup({
  context,
  itemId,
  setupId,
}: Db & { itemId: string; setupId: string }) {
  const checked = await checkSetupsItem({ context, itemId });
  if (!checked.ok) return checked;
  const row = await context.db.itemSetup.findFirst({
    where: { itemId, setupId },
    select: { id: true, capacity: true },
  });
  return row ? ok({ value: row }) : notFound({ entity: "Setup of the item" });
}

/** `CONFLICT` when another active layout of the item has the name (case-insensitive). */
export async function checkNameFree({
  context,
  itemId,
  name,
  exceptId,
}: Db & { itemId: string; name: string; exceptId?: string }): Promise<Result<true>> {
  const taken = await context.db.setupLayout.findFirst({
    where: {
      itemId,
      name: { equals: name, mode: "insensitive" },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (!taken) return ok({ value: true });
  const message = `The item already has a layout named "${name}"`;
  return conflict({ message, issues: [{ path: "name", message }] });
}

/** The layout with the plan it is drawn on, its seats, its setup's capacity and warnings. */
export async function readLayout({
  context,
  id,
}: Db & { id: string }): Promise<Result<SetupLayoutDto>> {
  const layout = await context.db.setupLayout.findFirst({ where: { id } });
  if (!layout) return notFound({ entity: "Layout" });
  const { itemId, setupId } = layout;
  const itemSetup = await loadItemSetup({ context, itemId, setupId });
  if (!itemSetup.ok) return itemSetup;
  const [plan, elements, seats] = await Promise.all([
    loadPlanState({ context, itemId }),
    loadElements({ context, parent: { setupLayoutId: id } }),
    loadLayoutSeats({ context, itemIds: [itemId] }),
  ]);
  const { capacity } = itemSetup.value;
  const largest = seats.get(layoutKey({ itemId, setupId }))?.seatCount ?? null;
  const issues = layoutIssues({
    outline: plan.outline,
    fixed: plan.elements.map((element) => toPlaced({ element })),
    elements: elements.map((element) => toPlaced({ element })),
  });
  const { widthCm, depthCm, outline, minAisleCm } = plan;
  return ok({
    value: {
      ...{ id, itemId, setupId, name: layout.name ?? "", version: layout.version },
      ...{ note: layout.note, elements, capacity, issues },
      seatCount: elements.reduce((sum, element) => sum + element.seatCount, 0),
      ...effectiveCapacity({ capacity, seatCount: largest }),
      plan: { widthCm, depthCm, outline, minAisleCm, elements: plan.elements },
    },
  });
}

/** Every layout of the item with its pieces, by setup in the given order, then by name. */
export async function loadLayoutSummaries({
  context,
  itemId,
  setupOrder,
}: Db & { itemId: string; setupOrder: readonly string[] }): Promise<LayoutSummaryDto[]> {
  const rows = await context.db.setupLayout.findMany({
    where: { itemId, setupId: { in: [...setupOrder] } },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    include: { elements: { include: ELEMENT_INCLUDE, orderBy: [{ position: "asc" }] } },
  });
  const rank = new Map(setupOrder.map((setupId, index) => [setupId, index]));
  return rows
    .map((row) => {
      const elements = row.elements.map((element) => toElementDto({ row: element }));
      const seatCount = elements.reduce((sum, element) => sum + element.seatCount, 0);
      const { id, setupId, version } = row;
      return { id, setupId, name: row.name ?? "", version, seatCount, elements };
    })
    .sort((a, b) => (rank.get(a.setupId) ?? 0) - (rank.get(b.setupId) ?? 0));
}
