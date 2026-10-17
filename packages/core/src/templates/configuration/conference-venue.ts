import { conferenceVenueTypes } from "./conference-venue-types";
import type { ConfigurationTemplate } from "./configuration-template";

/**
 * "Conference venue" starter pack (ADR 0021): what a conference estate typically configures.
 * Optional data, imported through ordinary operations and edited freely afterwards.
 */
export const conferenceVenueConfiguration: ConfigurationTemplate = {
  key: "conference-venue",
  name: "Conference venue",
  listTemplates: ["eu-14-allergens"],
  lists: [
    { name: "Diet", values: ["Vegetarian", "Vegan", "Halal", "Pork-free"] },
    { name: "Severity", values: ["Intolerance", "Allergy", "Anaphylaxis"] },
    { name: "Accessibility", values: ["Wheelchair", "Hearing loop", "Guide dog"] },
  ],
  setups: [
    { name: "Theatre", changeoverMinutes: 15 },
    { name: "Classroom", changeoverMinutes: 30 },
    { name: "U-shape", changeoverMinutes: 30 },
    { name: "Boardroom", changeoverMinutes: 20 },
    { name: "Cabaret", changeoverMinutes: 40 },
    { name: "Banquet", changeoverMinutes: 60 },
    { name: "Reception", changeoverMinutes: 15 },
  ],
  types: conferenceVenueTypes,
  responsibilities: [
    { name: "Sales", types: ["Package"] },
    { name: "Coordinator", types: ["Conference room", "Equipment"] },
    { name: "Head of kitchen", types: ["Dish", "Drink", "Meal"] },
  ],
};
