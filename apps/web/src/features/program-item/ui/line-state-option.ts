/** An item state a line can be in, for the run schedule's state column and menu (ADR 0044). */
export type LineStateOption = {
  id: string;
  name: string;
  color: string;
  /** Ids of the states a line may move to from this one. */
  transitionsTo: string[];
};
