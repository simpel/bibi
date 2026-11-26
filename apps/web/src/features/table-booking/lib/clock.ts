const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** Minutes after local midnight as `HH:mm`. */
export function minuteToTime({ minute }: { minute: number }): string {
  return `${pad({ value: Math.floor(minute / 60) })}:${pad({ value: minute % 60 })}`;
}

/** `HH:mm` as minutes after local midnight; NaN for anything else (validation rejects it). */
export function timeToMinute({ time }: { time: string }): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** A time field's value that may be empty (an exception that keeps the sitting's time). */
export function timeOrNull({ time }: { time: string }): number | null {
  return time.trim() === "" ? null : timeToMinute({ time });
}
