import type { DemoRunSheetDefinition } from "../../types";

/** Vingaleden's run sheet definitions (`docs/demo-seed.md`): none counts food. */
export const vingaledenRunSheets: readonly DemoRunSheetDefinition[] = [
  {
    name: "Pier order",
    types: ["Boat", "Skipper", "Add-on"],
    lists: ["Accessibility", "Life jacket"],
    responsibility: "Skipper",
  },
];
