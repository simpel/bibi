import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadItemState, toItemStateDto, WITH_STATE_TRANSITIONS } from "./load-item-state";
import {
  ItemStateIdInputSchema,
  ItemStateListInputSchema,
  ItemStateListOutputSchema,
  ItemStateSchema,
} from "./schema";

export const listItemStates = defineOperation({
  name: "itemState.list",
  kind: "query",
  description:
    "List the organization's item states (ADR 0044), per item type in the type's order, each " +
    "with its flags (initial, hold NONE/SOFT/HARD, inSheets, released, expires) and the states " +
    "a line may move to from it (`transitionsTo`). Filter by item type.",
  input: ItemStateListInputSchema,
  output: ItemStateListOutputSchema,
  permission: "itemState:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.itemState.findMany({
      where: input.entityTypeId ? { entityTypeId: input.entityTypeId } : {},
      orderBy: [{ entityTypeId: "asc" }, { position: "asc" }, { id: "asc" }],
      include: WITH_STATE_TRANSITIONS,
      ...pageArgs(input),
    });
    const states = rows.map((row) => toItemStateDto({ row }));
    return ok({ value: paginate({ rows: states, limit: input.limit }) });
  },
});

export const getItemState = defineOperation({
  name: "itemState.get",
  kind: "query",
  description: "Get one item state by id, with its flags and the states it may move to.",
  input: ItemStateIdInputSchema,
  output: ItemStateSchema,
  permission: "itemState:read",
  handler: async ({ input, context }) => {
    const state = await loadItemState({ context, id: input.id });
    return state ? ok({ value: state }) : notFound({ entity: "Item state" });
  },
});
