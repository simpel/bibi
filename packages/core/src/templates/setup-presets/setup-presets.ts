/** The phase and grid template a preset starts from (ADR 0045). */
export type SetupPresetPhases = "conference-estate" | "default";

export type SetupPresetType = {
  name: string;
  /** Held in time so it can never be double booked, e.g. a room. */
  bookable: boolean;
};

/**
 * A starting point for a new organization's first setup (ADR 0045): the item types to create, and
 * which phase template the ticket pipeline starts from. Everything can be changed in the setup.
 * Domain words live only in this data.
 */
export type SetupPreset = {
  key: string;
  itemTypes: readonly SetupPresetType[];
  phases: SetupPresetPhases;
};

export const SETUP_PRESET_KEYS = [
  "conference-estate",
  "restaurant",
  "experience-centre",
  "empty",
] as const;
export type SetupPresetKey = (typeof SETUP_PRESET_KEYS)[number];

const PRESETS: Record<SetupPresetKey, SetupPreset> = {
  "conference-estate": {
    key: "conference-estate",
    phases: "conference-estate",
    itemTypes: [
      { name: "Conference room", bookable: true },
      { name: "Equipment", bookable: true },
      { name: "Meal", bookable: false },
      { name: "Drink", bookable: false },
      { name: "Activity", bookable: false },
    ],
  },
  restaurant: {
    key: "restaurant",
    phases: "default",
    itemTypes: [
      { name: "Private room", bookable: true },
      { name: "Dish", bookable: false },
      { name: "Drink", bookable: false },
    ],
  },
  "experience-centre": {
    key: "experience-centre",
    phases: "conference-estate",
    itemTypes: [
      { name: "Hall", bookable: true },
      { name: "Guide", bookable: true },
      { name: "Tour", bookable: false },
      { name: "Meal", bookable: false },
    ],
  },
  empty: { key: "empty", phases: "default", itemTypes: [] },
};

export type GetSetupPresetInput = { key: SetupPresetKey };

export function getSetupPreset({ key }: GetSetupPresetInput): SetupPreset {
  return PRESETS[key];
}
