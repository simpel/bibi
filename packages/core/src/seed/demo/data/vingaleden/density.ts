import type { DemoDensity, DensityStatus } from "../../density-types";

const NEAR: readonly DensityStatus[] = [
  { status: "Confirmed" },
  { status: "Weather OK" },
  { status: "Confirmed" },
  { status: "Weather hold" },
];
/** Further out: requests (no move), weather holds, and some already confirmed. */
const FAR: readonly DensityStatus[] = [{}, { status: "Weather hold" }, { status: "Confirmed" }];

const per = { assignee: "Per Vinga", followers: ["Stina Holm"] };

/**
 * Saltholmen's busy weeks (#488): two or three boat trips every day (the harbor is open all week),
 * morning, afternoon and evening, each on its own boat with a skipper on board. A ticket carries
 * up to two trips. Near trips are Confirmed or Weather OK (hard holds) with the odd weather hold;
 * further out they are requests, weather holds or confirmed.
 */
export const vingaledenDensity: DemoDensity = {
  prefix: "T",
  timeZone: "Europe/Stockholm",
  ...{ fromDay: -7, toDay: 30, perTicket: 2, rotateSlots: false },
  perWeekday: [
    [2, 3],
    [2, 3],
    [2, 3],
    [2, 3],
    [2, 3],
    [2, 3],
    [2, 3],
  ],
  assets: ["M/S Kajan", "M/S Tern", "RIB Snabben"],
  crew: ["Kalle Ek", "Jonna Sand"],
  // One trip per slot, so the two skippers never sail at the same time.
  slots: [
    { from: "10:00", to: "12:00" },
    { from: "13:00", to: "15:30" },
    { from: "17:30", to: "20:00" },
  ],
  shapes: [
    { customer: "Hisingen Energi AB", type: "Charter", label: "Charter", headcount: 40, ...per },
    { customer: "Familjen Rask", type: "Round trip", label: "Round trip", headcount: 9, ...per },
    { customer: "Kvarnby Design AB", type: "Charter", label: "Team trip", headcount: 20 },
  ].map((shape) => ({ assignee: "Stina Holm", ...shape })),
  statusOf: ({ day, index }) =>
    day <= 10 ? (NEAR[index % NEAR.length] ?? {}) : (FAR[index % FAR.length] ?? {}),
};
