import { VENUE_KIND_PRESETS } from "./venue-kinds";

/** The status and grid template a preset starts from (ADR 0045, 0061). */
export type SetupPresetStatuses = "conference-estate" | "default";

export type SetupPresetType = {
  /** Stable id of the type within presets; the web app labels it `welcome.types.<key>`. */
  key: string;
  /** English name, used when no translation is given. */
  name: string;
  /** Held in time so it can never be double booked, e.g. a room. */
  bookable: boolean;
};

/**
 * A starting point for a new organization's first setup (ADR 0061): the item types to create, and
 * which status template the ticket pipeline starts from. Everything can be changed in the setup.
 * Domain words live only in this data (`venue-kinds.ts`).
 */
export type SetupPreset = {
  key: string;
  itemTypes: readonly SetupPresetType[];
  statuses: SetupPresetStatuses;
};

/** In display order: the 3×3 grid of the welcome flow, then "Start empty". */
export const SETUP_PRESET_KEYS = [
  "conference-estate",
  "manor-house",
  "experience-centre",
  "museum",
  "restaurant",
  "event-hall",
  "arena-hospitality",
  "theatre",
  "meeting-space",
  "empty",
] as const;
export type SetupPresetKey = (typeof SETUP_PRESET_KEYS)[number];

export type GetSetupPresetInput = { key: SetupPresetKey };

export function getSetupPreset({ key }: GetSetupPresetInput): SetupPreset {
  return { key, ...VENUE_KIND_PRESETS[key] };
}
