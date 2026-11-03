import type { DemoWorkOrderDefinition } from "../../types";

/** Vingaleden's work order definitions (`docs/demo-seed.md`): none counts food. */
export const vingaledenWorkOrders: readonly DemoWorkOrderDefinition[] = [
  {
    name: "Pier order",
    types: ["Boat", "Skipper", "Add-on"],
    lists: ["Accessibility", "Life jacket"],
    responsibility: "Skipper",
  },
];
