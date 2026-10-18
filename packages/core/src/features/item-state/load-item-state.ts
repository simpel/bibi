import type { ItemState, Prisma } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { ItemStateDto } from "./schema";

/** Prisma `include` that loads a state's allowed targets (active ones, in state order). */
export const WITH_STATE_TRANSITIONS = {
  transitionsFrom: {
    where: { toState: { status: "ACTIVE" } },
    select: { toStateId: true },
    orderBy: [{ toState: { position: "asc" } }, { toStateId: "asc" }],
  },
} satisfies Prisma.ItemStateInclude;

type Row = ItemState & { transitionsFrom: readonly { toStateId: string }[] };

export type ToItemStateDtoInput = { row: Row };

export function toItemStateDto({ row }: ToItemStateDtoInput): ItemStateDto {
  const { transitionsFrom, ...state } = row;
  return { ...state, transitionsTo: transitionsFrom.map((target) => target.toStateId) };
}

type Db = { context: Pick<OperationContext, "db"> };

export type LoadItemStateInput = Db & { id: string };

/** One active state with its transitions, or `null`. */
export async function loadItemState({
  context,
  id,
}: LoadItemStateInput): Promise<ItemStateDto | null> {
  const row = await context.db.itemState.findFirst({
    where: { id },
    include: WITH_STATE_TRANSITIONS,
  });
  return row ? toItemStateDto({ row }) : null;
}

export type LoadStatesOfTypeInput = Db & { entityTypeId: string };

/** Every active state of one item type in order (a type has a handful, never pages of them). */
export async function loadStatesOfType({ context, entityTypeId }: LoadStatesOfTypeInput) {
  const rows = await context.db.itemState.findMany({
    where: { entityTypeId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_STATE_TRANSITIONS,
  });
  return rows.map((row) => toItemStateDto({ row }));
}
