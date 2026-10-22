import {
  createEntityType,
  createItem,
  createItemDemand,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";
import { programSetup } from "./line-helpers";

type Ctx = { context: ExecuteContext };

type PoolInput = Ctx & {
  name: string;
  units: readonly string[];
  resourceKind?: "EQUIPMENT" | "PERSON";
  buffers?: { setupMinutes: number; teardownMinutes: number };
};

/** A bookable item type with its units, in the given order. */
export async function createUnits({ context, name, units, resourceKind, buffers }: PoolInput) {
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name, capabilities: ["BOOKABLE"], resourceKind, ...buffers },
      context,
    }),
  });
  const ids: string[] = [];
  for (const unit of units) {
    const input = { entityTypeId: type.id, name: unit };
    ids.push(unwrap({ result: await execute({ operation: createItem, input, context }) }).id);
  }
  return { type, ids };
}

/**
 * ADR 0059: a program with an AV pool of three (15 minutes setup and teardown) whose units each
 * need one technician for SETUP and TEARDOWN, and a technician pool of two (Person).
 */
export async function avSetup() {
  const program = await programSetup();
  const { context } = program;
  const technicians = await createUnits({
    context,
    name: "Technician",
    units: ["Tech A", "Tech B"],
    resourceKind: "PERSON",
  });
  const av = await createUnits({
    context,
    name: "AV",
    units: ["AV 1", "AV 2", "AV 3"],
    buffers: { setupMinutes: 15, teardownMinutes: 15 },
  });
  const demands = [];
  for (const itemId of av.ids) {
    const input = {
      itemId,
      entityTypeId: technicians.type.id,
      windows: ["SETUP", "TEARDOWN"] as const,
    };
    demands.push(
      unwrap({ result: await execute({ operation: createItemDemand, input, context }) }),
    );
  }
  return { ...program, technicians, av, demands };
}

/** The active rows a line holds, as `type unit kind hh:mm-hh:mm`, ordered. */
export async function heldRows({ context, lineId }: Ctx & { lineId: string }) {
  const rows = await context.db.occupancy.findMany({
    where: { lineId },
    include: { item: { select: { name: true } } },
    orderBy: [{ startsAt: "asc" }, { itemId: "asc" }],
  });
  const time = ({ at }: { at: Date }) => at.toISOString().slice(11, 16);
  return rows.map(
    ({ type, item, holdKind, startsAt, endsAt }) =>
      `${type} ${item.name} ${holdKind} ${time({ at: startsAt })}-${time({ at: endsAt })}`,
  );
}
