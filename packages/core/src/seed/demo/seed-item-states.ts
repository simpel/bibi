import { ok, type Result } from "../../errors/result";
import { updateEntityType } from "../../features/entity-type/write-operations";
import { archiveItemState } from "../../features/item-state/archive-operation";
import { listItemStates } from "../../features/item-state/read-operations";
import { createItemState } from "../../features/item-state/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import {
  ITEM_STATE_TEMPLATES,
  type ItemStateTemplateKey,
  type ItemStateTemplateState,
} from "../../templates/item-states/item-state-templates";

export type SeedItemStatesInput = {
  context: ExecuteContext;
  entityTypeId: string;
  template: ItemStateTemplateKey;
  bookable: boolean;
};

type CreateInput = Omit<SeedItemStatesInput, "template"> & {
  state: ItemStateTemplateState;
  initial: boolean;
};

const createState = ({ context, entityTypeId, bookable, state, initial }: CreateInput) =>
  execute({
    operation: createItemState,
    input: {
      ...{ entityTypeId, name: state.name, color: state.color, initial, ...state.flags },
      hold: bookable ? (state.holdIfBookable ?? "NONE") : "NONE",
    },
    context,
  });

/**
 * The item type's states from a template (ADR 0044), initial state first, via `itemState.*` as
 * SYSTEM: the type's default state is archived (no line uses it yet) and the template's expiry
 * state becomes the type's `expiryStateId`.
 */
export async function seedItemStates({
  template,
  ...input
}: SeedItemStatesInput): Promise<Result<true>> {
  const { context, entityTypeId } = input;
  const listed = await execute({
    operation: listItemStates,
    input: { entityTypeId, limit: 50 },
    context,
  });
  if (!listed.ok) return listed;
  const states: readonly ItemStateTemplateState[] = ITEM_STATE_TEMPLATES[template];
  let expiryStateId: string | null = null;
  for (const [index, state] of states.entries()) {
    const created = await createState({ ...input, state, initial: index === 0 });
    if (!created.ok) return created;
    if (state.expiry) expiryStateId = created.value.id;
  }
  for (const { id } of listed.value.items) {
    const archived = await execute({ operation: archiveItemState, input: { id }, context });
    if (!archived.ok) return archived;
  }
  const update = { id: entityTypeId, expiryStateId };
  const updated = await execute({ operation: updateEntityType, input: update, context });
  return updated.ok ? ok({ value: true }) : updated;
}
