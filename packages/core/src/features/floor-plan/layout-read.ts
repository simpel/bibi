import type { SetupLayout } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { ELEMENT_INCLUDE, loadElements, toElementDto, toPlaced } from "./element-rows";
import { BLOCKING_ISSUE_KINDS, type LayoutIssue, layoutIssues } from "./layout-issues";
import type { LayoutDto, LayoutSummaryDto } from "./layout-schema";
import { effectiveCapacity } from "./layout-seats";
import { loadPlanState } from "./plan-load";
import type { FloorElementDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** `CONFLICT` when another active layout of the room has the name (case-insensitive). */
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
  const message = `The room already has a layout named "${name}"`;
  return conflict({ message, issues: [{ path: "name", message }] });
}

const seatsOf = ({ elements }: { elements: readonly FloorElementDto[] }) =>
  elements.reduce((sum, element) => sum + element.seatCount, 0);

type Row = Pick<
  SetupLayout,
  "id" | "itemId" | "name" | "description" | "version" | "capacity" | "setupMinutes"
> &
  Pick<SetupLayout, "teardownMinutes">;

/** The facts of a layout row with its pieces, capacity included. */
function toFacts({ row, elements }: { row: Row; elements: readonly FloorElementDto[] }) {
  const seatCount = seatsOf({ elements });
  const { id, itemId, description, version, capacity, setupMinutes, teardownMinutes } = row;
  return {
    ...{ id, itemId, name: row.name ?? "", description, version, seatCount, capacity },
    ...{ setupMinutes, teardownMinutes },
    ...effectiveCapacity({ capacity, seatCount: elements.length ? seatCount : null }),
  };
}

/** The layout with the plan it is drawn on, its capacity, the room's limit and its problems. */
export async function readLayout({ context, id }: Db & { id: string }): Promise<Result<LayoutDto>> {
  const row = await context.db.setupLayout.findFirst({ where: { id } });
  if (!row) return notFound({ entity: "Layout" });
  const [plan, elements, item] = await Promise.all([
    loadPlanState({ context, itemId: row.itemId }),
    loadElements({ context, parent: { setupLayoutId: id } }),
    context.db.item.findFirst({ where: { id: row.itemId }, select: { maxPeople: true } }),
  ]);
  const facts = toFacts({ row, elements });
  const maxPeople = item?.maxPeople ?? null;
  const issues = layoutIssues({
    outline: plan.outline,
    fixed: plan.elements.map((element) => toPlaced({ element })),
    elements: elements.map((element) => toPlaced({ element })),
    capacity: facts.effectiveCapacity,
    maxPeople,
  });
  const { widthCm, depthCm, outline, minAisleCm } = plan;
  return ok({
    value: {
      ...facts,
      ...{ maxPeople, note: row.note, elements, issues },
      plan: { widthCm, depthCm, outline, minAisleCm, elements: plan.elements },
    },
  });
}

/**
 * `VALIDATION` when the layout breaks a hard limit (ADR 0103): more people than the room may hold
 * (`capacity`) or a piece in an emergency exit's zone (each piece's `elements.<index>`).
 */
export function checkHardLimits({
  layout,
  pieceIds,
}: {
  layout: Pick<LayoutDto, "issues" | "effectiveCapacity" | "maxPeople">;
  /** The saved pieces' ids in input order, to point issues at `elements.<index>`. */
  pieceIds: readonly string[];
}): Result<true> {
  const hard = layout.issues.filter((issue: LayoutIssue) =>
    BLOCKING_ISSUE_KINDS.includes(issue.kind),
  );
  if (hard.length === 0) return ok({ value: true });
  const issues = hard.flatMap((issue) => {
    if (issue.kind === "OVER_LIMIT") {
      const message = `The layout holds ${layout.effectiveCapacity} people; the room allows at most ${layout.maxPeople}`;
      return [{ path: "capacity", message }];
    }
    return issue.elementIds.map((elementId) => ({
      path: `elements.${pieceIds.indexOf(elementId)}`,
      message: "This piece stands in front of an emergency exit",
    }));
  });
  return invalid({ message: issues[0]?.message ?? "The layout breaks a hard limit", issues });
}

/** Every layout of the room with its pieces, by name. */
export async function loadLayoutSummaries({
  context,
  itemId,
}: Db & { itemId: string }): Promise<LayoutSummaryDto[]> {
  const rows = await context.db.setupLayout.findMany({
    where: { itemId },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    include: { elements: { include: ELEMENT_INCLUDE, orderBy: [{ position: "asc" }] } },
  });
  return rows.map((row) => {
    const elements = row.elements.map((element) => toElementDto({ row: element }));
    return { ...toFacts({ row, elements }), elements };
  });
}
