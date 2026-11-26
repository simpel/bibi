import { DiningServiceExceptionSetInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { minuteToTime, timeOrNull } from "./clock";

/** Raw values of the exception form. */
export type ExceptionFormValues = {
  serviceId: string;
  date: string;
  closed: boolean;
  firstStart: string;
  lastStart: string;
  /** A layout id, or `NONE` = the sitting's. */
  layoutId: string;
  maxCoversPerSlot: string;
  note: string;
};

export function exceptionToInput({ values }: { values: ExceptionFormValues }) {
  return {
    serviceId: values.serviceId,
    date: values.date,
    closed: values.closed,
    firstStartMinute: values.closed ? null : timeOrNull({ time: values.firstStart }),
    lastStartMinute: values.closed ? null : timeOrNull({ time: values.lastStart }),
    layoutId: values.closed || values.layoutId === NONE ? null : values.layoutId,
    maxCoversPerSlot: values.closed ? null : numberOrNull({ value: values.maxCoversPerSlot }),
    note: blankToNull({ value: values.note }),
  };
}

export const exceptionFormSchema = formSchema({
  schema: DiningServiceExceptionSetInputSchema,
  toInput: exceptionToInput,
});

export type ExceptionFormOutput = z.output<typeof exceptionFormSchema>;

export const NEW_EXCEPTION: ExceptionFormValues = {
  serviceId: "",
  date: "",
  closed: true,
  firstStart: "",
  lastStart: "",
  layoutId: NONE,
  maxCoversPerSlot: "",
  note: "",
};

export type ExceptionRow = {
  serviceId: string;
  serviceName: string;
  date: string;
  dateLabel: string;
  /** What changes that day, written for the user. */
  summary: string;
  values: ExceptionFormValues;
};

export type ExceptionDefaultsInput = {
  serviceId: string;
  date: string;
  closed: boolean;
  firstStartMinute: number | null;
  lastStartMinute: number | null;
  layoutId: string | null;
  maxCoversPerSlot: number | null;
  note: string | null;
};

export function exceptionDefaults({
  firstStartMinute,
  lastStartMinute,
  layoutId,
  maxCoversPerSlot,
  note,
  ...rest
}: ExceptionDefaultsInput): ExceptionFormValues {
  return {
    serviceId: rest.serviceId,
    date: rest.date,
    closed: rest.closed,
    firstStart: firstStartMinute === null ? "" : minuteToTime({ minute: firstStartMinute }),
    lastStart: lastStartMinute === null ? "" : minuteToTime({ minute: lastStartMinute }),
    layoutId: layoutId ?? NONE,
    maxCoversPerSlot: maxCoversPerSlot === null ? "" : String(maxCoversPerSlot),
    note: note ?? "",
  };
}
