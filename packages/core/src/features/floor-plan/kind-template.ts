import type { FloorElementKindCreateInput } from "./schema";

/**
 * The starter furniture library ("conference-banquet", ADR 0099). Only data: names are the
 * organization's to change after the import, and the import skips names that exist.
 */
export const CONFERENCE_BANQUET_KINDS: readonly FloorElementKindCreateInput[] = [
  { name: "Round table Ø180", shape: "ROUND", widthCm: 180, depthCm: 180, seats: 10 },
  { name: "Round table Ø150", shape: "ROUND", widthCm: 150, depthCm: 150, seats: 8 },
  { name: "Table 180 × 80", shape: "RECT", widthCm: 180, depthCm: 80, seatsTop: 3, seatsBottom: 3 },
  { name: "Table 120 × 60", shape: "RECT", widthCm: 120, depthCm: 60, seatsBottom: 2 },
  { name: "Row of chairs", shape: "SEAT_ROW", widthCm: 300, depthCm: 50, seats: 6 },
  { name: "High table Ø70", shape: "ROUND", widthCm: 70, depthCm: 70 },
  { name: "Stage", shape: "RECT", widthCm: 400, depthCm: 200 },
  { name: "Buffet", shape: "RECT", widthCm: 240, depthCm: 80 },
  { name: "Dance floor", shape: "ZONE", widthCm: 400, depthCm: 400 },
  { name: "Door", shape: "DOOR", widthCm: 90, depthCm: 12, fixed: true, swingDeg: 90 },
  { name: "Window", shape: "WINDOW", widthCm: 120, depthCm: 12, fixed: true, swingDeg: 0 },
  { name: "Pillar", shape: "RECT", widthCm: 40, depthCm: 40, fixed: true },
  { name: "Screen", shape: "RECT", widthCm: 400, depthCm: 16, fixed: true },
];
