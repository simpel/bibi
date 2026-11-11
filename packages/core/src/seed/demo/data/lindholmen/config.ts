import type { DemoConfig } from "../../config-types";

/** Lindholmen's lists and layout setup minutes (`docs/demo-seed.md`, Configuration). */
export const lindholmenLists: Pick<DemoConfig, "listTemplates" | "lists" | "layoutMinutes"> = {
  listTemplates: ["eu-14-allergens"],
  lists: [
    { name: "Diet", values: ["Vegetarian", "Vegan", "Halal", "Pork-free"] },
    { name: "Severity", values: ["Intolerance", "Allergy", "Anaphylaxis"] },
    { name: "Accessibility", values: ["Wheelchair", "Hearing loop", "Guide dog"] },
    { name: "View", values: ["River", "Courtyard", "None"] },
    { name: "Dresscode", values: ["Casual", "Blazer", "Dark suit"] },
  ],
  /** ADR 0103: the setup minutes of every room's layout with this name. */
  layoutMinutes: {
    Theatre: 15,
    Classroom: 30,
    "U-shape": 30,
    Boardroom: 20,
    Cabaret: 40,
    Banquet: 60,
    Reception: 15,
  },
};
