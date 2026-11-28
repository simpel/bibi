/** One held-back table in the room's blocks list, texts ready to show. */
export type BlockRow = {
  id: string;
  label: string;
  kind: "BLOCK" | "ONLINE_ONLY";
  /** For sorting. */
  startsAt: string;
  period: string;
  note: string;
};
