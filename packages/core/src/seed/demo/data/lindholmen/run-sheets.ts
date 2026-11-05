import type { DemoRunSheetDefinition } from "../../types";

/** Lindholmen's run sheet definitions (`docs/demo-seed.md`, Run sheets). */
export const lindholmenRunSheets: readonly DemoRunSheetDefinition[] = [
  {
    name: "Kitchen order",
    types: ["Dish", "Drink", "Meal"],
    lists: ["Allergens", "Diet"],
    responsibility: "Head of kitchen",
  },
  {
    name: "Setup order",
    types: ["Conference room", "Equipment"],
    lists: ["Accessibility"],
    responsibility: "Coordinator",
  },
  {
    name: "Guide brief",
    types: ["Tour", "Guide"],
    lists: ["Accessibility"],
    responsibility: "Coordinator",
  },
];
