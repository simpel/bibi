import {
  DiningServiceCreateInputSchema,
  type DiningServiceDto,
  PlainDateStringSchema,
} from "@bibi/core/schemas";
import type { z } from "zod";
import { blankToNull, minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { minuteToTime, timeToMinute } from "./clock";

/** Raw values of the sitting form: inputs are strings, "" meaning empty. */
export type SittingFormValues = {
  name: string;
  layoutId: string;
  /** 0 = Monday … 6 = Sunday. */
  weekdays: number[];
  firstStart: string;
  lastStart: string;
  validFromDate: string;
  validUntilDate: string;
  slotMinutes: string;
  turnTimes: { upToParty: string; minutes: string }[];
  maxCoversPerSlot: string;
  minMinutesAhead: string;
  maxDaysAhead: string;
  changeCutoffMinutes: string;
  maxOnlineParty: string;
  depositFromParty: string;
  /** In whole currency units; core stores minor units. */
  depositPerCover: string;
};

const number = ({ value }: { value: string }) => Number(value.trim().replace(",", "."));

export function sittingToInput({ values }: { values: SittingFormValues }) {
  return {
    name: values.name.trim(),
    layoutId: values.layoutId,
    weekdays: [...values.weekdays].sort((a, b) => a - b),
    firstStartMinute: timeToMinute({ time: values.firstStart }),
    lastStartMinute: timeToMinute({ time: values.lastStart }),
    validFromDate: blankToNull({ value: values.validFromDate }),
    validUntilDate: blankToNull({ value: values.validUntilDate }),
    slotMinutes: number({ value: values.slotMinutes }),
    turnTimes: values.turnTimes.map((row) => ({
      upToParty: number({ value: row.upToParty }),
      minutes: number({ value: row.minutes }),
    })),
    maxCoversPerSlot: numberOrNull({ value: values.maxCoversPerSlot }),
    minMinutesAhead: number({ value: values.minMinutesAhead }),
    maxDaysAhead: number({ value: values.maxDaysAhead }),
    changeCutoffMinutes: number({ value: values.changeCutoffMinutes }),
    maxOnlineParty: number({ value: values.maxOnlineParty }),
    depositFromParty: numberOrNull({ value: values.depositFromParty }),
    depositPerCoverMinor: minorOrNull({ value: values.depositPerCover }),
  };
}

/** Core's create schema, with the season as local days (instants are made on the server). */
export const sittingFormSchema = formSchema({
  schema: DiningServiceCreateInputSchema.omit({
    roomItemId: true,
    validFrom: true,
    validUntil: true,
  }).extend({
    validFromDate: PlainDateStringSchema.nullable(),
    validUntilDate: PlainDateStringSchema.nullable(),
  }),
  toInput: sittingToInput,
});

export type SittingFormOutput = z.output<typeof sittingFormSchema>;

/** What a sitting gets when it is created: core's own defaults. */
export const NEW_SITTING: SittingFormValues = {
  name: "",
  layoutId: "",
  weekdays: [0, 1, 2, 3, 4],
  firstStart: "11:30",
  lastStart: "14:00",
  validFromDate: "",
  validUntilDate: "",
  slotMinutes: "15",
  turnTimes: [
    { upToParty: "4", minutes: "90" },
    { upToParty: "8", minutes: "120" },
  ],
  maxCoversPerSlot: "",
  minMinutesAhead: "120",
  maxDaysAhead: "60",
  changeCutoffMinutes: "180",
  maxOnlineParty: "8",
  depositFromParty: "",
  depositPerCover: "",
};

export type SittingDefaultsInput = {
  sitting: DiningServiceDto;
  /** The season's local days, read in the room's zone on the server. */
  from: string;
  until: string;
};

/** A stored sitting as form values. */
export function sittingDefaults({ sitting, from, until }: SittingDefaultsInput): SittingFormValues {
  return {
    name: sitting.name,
    layoutId: sitting.layoutId,
    weekdays: [...sitting.weekdays],
    firstStart: minuteToTime({ minute: sitting.firstStartMinute }),
    lastStart: minuteToTime({ minute: sitting.lastStartMinute }),
    validFromDate: from,
    validUntilDate: until,
    slotMinutes: String(sitting.slotMinutes),
    turnTimes: sitting.turnTimes.map((row) => ({
      upToParty: String(row.upToParty),
      minutes: String(row.minutes),
    })),
    maxCoversPerSlot: sitting.maxCoversPerSlot === null ? "" : String(sitting.maxCoversPerSlot),
    minMinutesAhead: String(sitting.minMinutesAhead),
    maxDaysAhead: String(sitting.maxDaysAhead),
    changeCutoffMinutes: String(sitting.changeCutoffMinutes),
    maxOnlineParty: String(sitting.maxOnlineParty),
    depositFromParty: sitting.depositFromParty === null ? "" : String(sitting.depositFromParty),
    depositPerCover:
      sitting.depositPerCoverMinor === null ? "" : String(sitting.depositPerCoverMinor / 100),
  };
}
