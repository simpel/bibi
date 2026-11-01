"use client";

import { useRememberedValue } from "./flow-memory";
import { NumberFlow, type NumberFlowProps } from "./hero-number";

/** How an animated amount is written: the separators and currency text of the user's money format. */
export type MoneyFlowSettings = {
  locales: string;
  format: { minimumFractionDigits: number; maximumFractionDigits: number };
  prefix: string;
  suffix: string;
};

export type MoneyNumberFlowProps = Omit<
  NumberFlowProps,
  "locales" | "format" | "prefix" | "suffix"
> & {
  flow: MoneyFlowSettings;
  /** Overrides the flow's fraction digits, e.g. whole units for an overview. */
  format?: MoneyFlowSettings["format"];
  /** Text before the currency, e.g. `from `. */
  lead?: string;
  /**
   * Names the figure in a `FlowMemory`: after a remount (a new range in the URL) it counts from
   * the value it last showed instead of appearing at once.
   */
  memoryKey?: string;
};

/**
 * An animated amount in the user's money format. NumberFlow animates digits but does not redraw
 * its separators and currency text when the format changes, so a new format remounts it.
 */
export function MoneyNumberFlow(props: MoneyNumberFlowProps) {
  const { flow, format, lead = "", memoryKey, value, ...rest } = props;
  const { locales, prefix, suffix } = flow;
  const shown = useRememberedValue({ key: memoryKey, value: Number(value) });
  return (
    <NumberFlow
      key={`${locales}|${prefix}|${suffix}`}
      locales={locales}
      format={format ?? flow.format}
      prefix={`${lead}${prefix}`}
      suffix={suffix}
      value={shown}
      {...rest}
    />
  );
}
