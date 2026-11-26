import type { SittingFormValues } from "./sitting-form";

/** A sitting as its table and edit sheet need it, all texts written on the server. */
export type SittingRow = {
  id: string;
  name: string;
  weekdays: number[];
  weekdaysLabel: string;
  /** `11:30 – 14:00` */
  startsLabel: string;
  layoutName: string;
  covers: string;
  season: string;
  values: SittingFormValues;
};

export type LayoutOption = { id: string; name: string };
