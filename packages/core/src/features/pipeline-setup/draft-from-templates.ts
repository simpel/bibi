/**
 * Client-safe (`@bibi/core/pipeline-setup-templates`): builds guided-setup drafts (ADR 0044) from
 * the template data only, so the wizard can refill a step in the browser. No Prisma imports.
 */
import {
  ITEM_STATE_TEMPLATES,
  type ItemStateTemplateKey,
  type ItemStateTemplateState,
} from "../../templates/item-states/item-state-templates";
import {
  getSetupPreset,
  type SetupPresetKey,
  type SetupPresetStatuses,
} from "../../templates/setup-presets/setup-presets";
import { getStatusGridTemplate } from "../../templates/status-grid/status-grid-templates";
import { getTicketStatusTemplate } from "../../templates/ticket-statuses/ticket-status-templates";
import type {
  PipelineCellDraft,
  PipelineSetupDraft,
  PipelineStateDraft,
  PipelineStatusDraft,
  PipelineTypeDraft,
} from "./schema";

/** The state templates of the wizard: one per capability, or one state "Active". */
export const STATE_TEMPLATE_CHOICES = ["bookable", "food", "other", "single"] as const;
export type StateTemplateChoice = (typeof STATE_TEMPLATE_CHOICES)[number];

/** The status (and grid) templates of the wizard. */
export const PIPELINE_TEMPLATE_KEYS = ["conference-estate", "default"] as const;
export type PipelineTemplateKey = (typeof PIPELINE_TEMPLATE_KEYS)[number];

const SINGLE: readonly ItemStateTemplateState[] = [
  { name: "Active", color: "#64748b", holdIfBookable: "HARD", flags: { inSheets: true } },
];

export type StatesFromTemplateInput = { template: StateTemplateChoice; bookable: boolean };

/** A type's states from a template, initial state first, and its expiry state. */
export function statesFromTemplate({ template, bookable }: StatesFromTemplateInput) {
  const source: readonly ItemStateTemplateState[] =
    template === "single" ? SINGLE : ITEM_STATE_TEMPLATES[template as ItemStateTemplateKey];
  const states = source.map(
    (state, index): Required<PipelineStateDraft> => ({
      name: state.name,
      color: state.color,
      initial: index === 0,
      hold: bookable ? (state.holdIfBookable ?? "NONE") : "NONE",
      inSheets: state.flags?.inSheets ?? false,
      released: state.flags?.released ?? false,
      expires: state.flags?.expires ?? false,
    }),
  );
  return { states, expiryState: source.find((state) => state.expiry)?.name ?? null };
}

/** The template for a type's capability: bookable types hold, others are planned. */
export const defaultStateTemplate = ({ bookable }: { bookable: boolean }): StateTemplateChoice =>
  bookable ? "bookable" : "other";

/** The template's statuses with every flag spelled out. */
export function statusesFromTemplate({ template }: { template: PipelineTemplateKey }) {
  return getTicketStatusTemplate({ key: template }).statuses.map(
    (status): Required<PipelineStatusDraft> => ({
      name: status.name,
      color: status.color,
      entry: status.entry ?? false,
      closes: status.closes ?? false,
      requiresReason: status.requiresReason ?? false,
      requiresAssignee: status.requiresAssignee ?? false,
      requiresAcceptedQuote: status.requiresAcceptedQuote ?? false,
      invoiceable: status.invoiceable ?? false,
      event: status.event ?? null,
    }),
  );
}

export type CellsFromTemplateInput = {
  template: PipelineTemplateKey;
  statuses: readonly PipelineStatusDraft[];
  itemTypes: readonly Pick<PipelineTypeDraft, "name" | "states">[];
};

/**
 * The grid template's cells for the draft, by name: per open status and type, the first template
 * cell of the status whose state the type has. Statuses and types without a match keep the state.
 */
export function cellsFromTemplate({ template, statuses, itemTypes }: CellsFromTemplateInput) {
  const cells = getStatusGridTemplate({ key: template }).cells;
  return statuses
    .filter((status) => !status.closes)
    .flatMap((status) =>
      itemTypes.flatMap((type): PipelineCellDraft[] => {
        const names = new Set(type.states.map((state) => state.name));
        const match = cells.find((cell) => cell.status === status.name && names.has(cell.state));
        return match ? [{ ticketStatus: status.name, type: type.name, state: match.state }] : [];
      }),
    );
}

export type ExistingSetupType = { id: string; name: string; bookable: boolean };

export type DraftFromPresetInput = {
  key: SetupPresetKey;
  existingTypes: readonly ExistingSetupType[];
};

/** A whole draft from a setup preset (ADR 0061): `draftFromTypes` with the preset's types. */
export function draftFromPreset({ key, existingTypes }: DraftFromPresetInput): PipelineSetupDraft {
  const preset = getSetupPreset({ key });
  return draftFromTypes({ statuses: preset.statuses, types: preset.itemTypes, existingTypes });
}

export type DraftFromTypesInput = {
  statuses: SetupPresetStatuses;
  /** The new types by name, e.g. a preset's types as the user ticked and named them. */
  types: readonly { name: string; bookable: boolean }[];
  existingTypes: readonly ExistingSetupType[];
};

/**
 * A whole draft from chosen types (ADR 0061): existing item types are kept, chosen types not
 * there yet (by name) are added, and states, statuses and the grid come from the templates.
 */
export function draftFromTypes({
  statuses: template,
  types,
  existingTypes,
}: DraftFromTypesInput): PipelineSetupDraft {
  const known = new Set(existingTypes.map((type) => type.name.toLowerCase()));
  const wanted = [
    ...existingTypes.map((type) => ({ ...type, entityTypeId: type.id })),
    ...types
      .filter((type) => !known.has(type.name.toLowerCase()))
      .map(({ name, bookable }) => ({ name, bookable, entityTypeId: undefined })),
  ];
  const itemTypes = wanted.map(({ entityTypeId, name, bookable }): PipelineTypeDraft => {
    const states = statesFromTemplate({ template: defaultStateTemplate({ bookable }), bookable });
    const identity = entityTypeId
      ? { entityTypeId }
      : bookable
        ? { capabilities: ["BOOKABLE" as const] }
        : {};
    return { ...identity, name, ...states };
  });
  const statuses = statusesFromTemplate({ template });
  return { itemTypes, statuses, cells: cellsFromTemplate({ template, statuses, itemTypes }) };
}
