export type ToLocalInputValueInput = { date: Date };

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** A `datetime-local` input value (`YYYY-MM-DDTHH:mm`) in the browser's time zone. */
export function toLocalInputValue({ date }: ToLocalInputValueInput): string {
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  const [year, month, dayOfMonth] = day.map((value) => pad({ value }));
  return `${year}-${month}-${dayOfMonth}T${pad({ value: date.getHours() })}:${pad({ value: date.getMinutes() })}`;
}

export type FromLocalInputValueInput = { value: string };

/** A `datetime-local` value as a Date in the browser's time zone; empty → undefined. */
export function fromLocalInputValue({ value }: FromLocalInputValueInput): Date | undefined {
  return value.trim() === "" ? undefined : new Date(value);
}
