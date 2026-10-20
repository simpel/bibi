/**
 * F6 expired, L11 confirmed, L12 blocked; L7, L10 from templates; quoted tickets get lunch;
 * L13's alternatives both soft, L14's pick booked and the other option released (ADR 0052).
 */
export const LINDHOLMEN_LINE_STATES = [
  ["Afternoon break buffet", "Ordered", false],
  ["Afternoon break room", "Booked", false],
  ["Board lunch", "Locked", true],
  ["Board meeting", "Booked", false],
  ["Coffee and tea", "Estimated", false],
  ...Array.from({ length: 2 }, () => ["Conference lunch", "Estimated", false]),
  ...Array.from({ length: 6 }, () => ["Conference lunch", "Ordered", false]),
  ["Half-day conference", "Booked", false],
  ["Kickoff", "Prebooked", false],
  ["Planning in Hönö", "Booked", false],
  ["Planning in Styrsö", "Released", true],
  ["Product launch", "Prebooked", false],
  ["Projector hire", "Booked", false],
  ["Small meeting room", "Booked", false],
  ["Strategy meeting", "Prebooked", false],
  ["Team day", "Released", false],
  ["Workshop in Hönö", "Prebooked", false],
  ["Workshop in Styrsö", "Prebooked", false],
];
