import type { DemoWorkOrderDefinition } from "../../types";

/** Lindholmen's work order definitions (`docs/demo-seed.md`, Work orders). */
export const lindholmenWorkOrders: readonly DemoWorkOrderDefinition[] = [
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
