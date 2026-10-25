import type { DemoType } from "../../config-types";
import type { DemoStaffLink } from "../../types";

/** ADR 0068: a second Person type next to Technician, so one member can hold two positions. */
export const lindholmenStaffTypes: readonly DemoType[] = [
  {
    base: "ITEM",
    name: "Host",
    states: "bookable",
    capabilities: ["BOOKABLE"],
    resourceKind: "PERSON",
  },
];

/**
 * Lindholmen's member profiles (ADR 0068, `docs/demo-seed.md`, Member profiles): Erik works shifts
 * and holds two positions (Technician and Host); Lena is called in as a technician when needed.
 */
export const lindholmenStaff: readonly DemoStaffLink[] = [
  { member: "Erik Lund", scheduleKind: "SHIFTS", items: ["Technician 1", "Host 1"] },
  { member: "Lena Strand", scheduleKind: "CASUAL", items: ["Technician 2"] },
];
