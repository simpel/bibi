export type MonthLabelInput = {
  /** `finance.monthLabel`: one message with the month and the two-digit year. */
  label: (values: { month: string; year: string }) => string;
};

/** `YYYY-MM` → "mar 26" in the UI language (ICU select in the message, no zone involved). */
export function monthLabelOf({ label }: MonthLabelInput) {
  return ({ month }: { month: string }): string => {
    const [year = "", index = "1"] = month.split("-");
    return label({ month: String(Number(index)), year: year.slice(2) });
  };
}
