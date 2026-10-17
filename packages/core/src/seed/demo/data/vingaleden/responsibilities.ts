import type { DemoResponsibility } from "../../types";

/** Vingaleden's responsibilities (`docs/demo-seed.md`): item types by name, people by user name. */
export const vingaledenResponsibilities: readonly DemoResponsibility[] = [
  { name: "Booking", types: ["Tour", "Add-on"], assignee: "Stina Holm" },
  { name: "Skipper", types: ["Boat", "Skipper"], assignee: "Kalle Ek", followers: ["Jonna Sand"] },
];
