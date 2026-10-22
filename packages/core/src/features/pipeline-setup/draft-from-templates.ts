/**
 * Client-safe (`@bibi/core/pipeline-setup-templates`): builds guided-setup drafts (ADR 0044) from
 * the template data only, so the wizard can refill a step in the browser. No Prisma imports.
 */
import {
  ITEM_STATE_TEMPLATES,
  type ItemStateTemplateKey,
  type ItemStateTemplateState,
} from "../../templates/item-states/item-state-templates";
import { getPhaseGridTemplate } from "../../templates/phase-grid/phase-grid-templates";
import {
  getSetupPreset,
  type SetupPresetKey,
  type SetupPresetPhases,
} from "../../templates/setup-presets/setup-presets";
import { getTicketPhaseTemplate } from "../../templates/ticket-phases/ticket-phase-templates";
import type {
  PipelineCellDraft,
  PipelinePhaseDraft,
  PipelineSetupDraft,
  PipelineStateDraft,
  PipelineTypeDraft,
} from "./schema";

/** The state templates of the wizard: one per capability, or one state "Active". */
export const STATE_TEMPLATE_CHOICES = ["bookable", "food", "other", "single"] as const;
export type StateTemplateChoice = (typeof STATE_TEMPLATE_CHOICES)[number];

/** The phase (and grid) templates of the wizard. */
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

/** The template's phases with every flag spelled out. */
export function phasesFromTemplate({ template }: { template: PipelineTemplateKey }) {
  return getTicketPhaseTemplate({ key: template }).phases.map(
    (phase): Required<PipelinePhaseDraft> => ({
      name: phase.name,
      color: phase.color,
      entry: phase.entry ?? false,
      terminal: phase.terminal ?? false,
      requiresReason: phase.requiresReason ?? false,
      requiresAssignee: phase.requiresAssignee ?? false,
      requiresAcceptedQuote: phase.requiresAcceptedQuote ?? false,
      invoiceable: phase.invoiceable ?? false,
      event: phase.event ?? null,
    }),
  );
}

export type CellsFromTemplateInput = {
  template: PipelineTemplateKey;
  phases: readonly PipelinePhaseDraft[];
  itemTypes: readonly Pick<PipelineTypeDraft, "name" | "states">[];
};

/**
 * The grid template's cells for the draft, by name: per open phase and type, the first template
 * cell of the phase whose state the type has. Phases and types without a match keep the state.
 */
export function cellsFromTemplate({ template, phases, itemTypes }: CellsFromTemplateInput) {
  const cells = getPhaseGridTemplate({ key: template }).cells;
  return phases
    .filter((phase) => !phase.terminal)
    .flatMap((phase) =>
      itemTypes.flatMap((type): PipelineCellDraft[] => {
        const names = new Set(type.states.map((state) => state.name));
        const match = cells.find((cell) => cell.phase === phase.name && names.has(cell.state));
        return match ? [{ phase: phase.name, type: type.name, state: match.state }] : [];
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
  return draftFromTypes({ phases: preset.phases, types: preset.itemTypes, existingTypes });
}

export type DraftFromTypesInput = {
  phases: SetupPresetPhases;
  /** The new types by name, e.g. a preset's types as the user ticked and named them. */
  types: readonly { name: string; bookable: boolean }[];
  existingTypes: readonly ExistingSetupType[];
};

/**
 * A whole draft from chosen types (ADR 0061): existing item types are kept, chosen types not
 * there yet (by name) are added, and states, phases and the grid come from the templates.
 */
export function draftFromTypes({
  phases: template,
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
  const phases = phasesFromTemplate({ template });
  return { itemTypes, phases, cells: cellsFromTemplate({ template, phases, itemTypes }) };
}
