/**
 * Client-safe (`@bibi/core/pipeline-setup-localize`): renames a template draft's statuses and
 * states into the organization's language before it is activated. Templates are English data;
 * the draft matches everything by name, so every reference is renamed with its target.
 */
import type { PipelineSetupDraft } from "./schema";

export type LocalizeDraftInput = {
  draft: PipelineSetupDraft;
  /** A template status name in the user's language, or the name as it is. */
  statusName: (input: { name: string }) => string;
  /** A template state name in the user's language, or the name as it is. */
  stateName: (input: { name: string }) => string;
};

/** The draft with translated status and state names, cells and expiry states included. */
export function localizeDraft({
  draft,
  statusName,
  stateName,
}: LocalizeDraftInput): PipelineSetupDraft {
  return {
    ...draft,
    statuses: draft.statuses.map((status) => ({
      ...status,
      name: statusName({ name: status.name }),
    })),
    itemTypes: draft.itemTypes.map((type) => ({
      ...type,
      states: type.states.map((state) => ({ ...state, name: stateName({ name: state.name }) })),
      expiryState: type.expiryState ? stateName({ name: type.expiryState }) : type.expiryState,
    })),
    cells: draft.cells.map((cell) => ({
      ...cell,
      orderStatus: statusName({ name: cell.orderStatus }),
      state: stateName({ name: cell.state }),
    })),
  };
}

/** The translation key of a template name: "Final count locked" → "final-count-locked". */
export const templateNameKey = ({ name }: { name: string }): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
