/**
 * F6 expired, L11 confirmed, L12 blocked; L7, L10 from templates; quoted tickets get lunch;
 * L13's alternatives both soft, L14's pick booked and the other option released (ADR 0052);
 * L15's bundle with its part lines in Quote sent (ADR 0059); L9's dinner with its options (ADR 0082).
 */
export const LINDHOLMEN_LINE_STATES = [
  ["Afternoon break buffet", "Ordered", false],
  ["Afternoon break room", "Booked", false],
  // L9's team dinner and its chosen options, the main course split 10 + 4 (ADR 0082).
  ["Beetroot carpaccio with chèvre", "Ordered", false],
  ["Board lunch", "Locked", true],
  ["Board meeting", "Booked", false],
  ["Celeriac steak, mustard vinaigrette", "Ordered", false],
  ["Cloudberry parfait", "Ordered", false],
  ["Coffee and tea", "Estimated", false],
  // L15's bundle line (the Bundle type's initial state) and its part lines (ADR 0059).
  ["Conference day", "Active", false],
  ...Array.from({ length: 3 }, () => ["Conference lunch", "Estimated", false]),
  ...Array.from({ length: 6 }, () => ["Conference lunch", "Ordered", false]),
  // L2 and L1, Completed and invoiced (ADR 0077): a closing status released their lines.
  ["Dinner", "Released", false],
  ["Half-day conference", "Booked", false],
  ["Kickoff", "Prebooked", false],
  ["Lunch", "Released", false],
  ["Morning break", "Estimated", false],
  ["Planning in Hönö", "Booked", false],
  ["Planning in Styrsö", "Released", true],
  ["Product launch", "Prebooked", false],
  ["Projector hire", "Booked", false],
  ["Small meeting room", "Booked", false],
  // L4's sound system, with a technician allocated for its setup and teardown (ADR 0059).
  ["Sound for the conference", "Booked", false],
  ["Strategy meeting", "Prebooked", false],
  ["Team day", "Released", false],
  ["Team dinner", "Ordered", false],
  ["Venison fillet, celeriac purée", "Ordered", false],
  ["Vrångö", "Prebooked", false],
  ["Workshop in Hönö", "Prebooked", false],
  ["Workshop in Styrsö", "Prebooked", false],
];
