import type { DemoResponsibility } from "../../types";

/** Lindholmen's responsibilities (`docs/demo-seed.md`): item types by name, people by user name. */
export const lindholmenResponsibilities: readonly DemoResponsibility[] = [
  { name: "Sales", types: ["Bundle"], assignee: "Erik Lund", followers: ["Sara Nilsson"] },
  {
    name: "Coordinator",
    types: ["Conference room", "Equipment", "Tour", "Guide"],
    assignee: "Johan Ek",
    followers: ["Maria Holm"],
  },
  { name: "Head of kitchen", types: ["Dish", "Drink", "Meal"], assignee: "Ali Karimi" },
];
