import type { DemoConfig } from "../../config-types";

/** Lindholmen's lists and setups (`docs/demo-seed.md`, Configuration). */
export const lindholmenLists: Pick<DemoConfig, "listTemplates" | "lists" | "setups"> = {
  listTemplates: ["eu-14-allergens"],
  lists: [
    { name: "Diet", values: ["Vegetarian", "Vegan", "Halal", "Pork-free"] },
    { name: "Severity", values: ["Intolerance", "Allergy", "Anaphylaxis"] },
    { name: "Accessibility", values: ["Wheelchair", "Hearing loop", "Guide dog"] },
    { name: "View", values: ["River", "Courtyard", "None"] },
    { name: "Dresscode", values: ["Casual", "Blazer", "Dark suit"] },
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
};
