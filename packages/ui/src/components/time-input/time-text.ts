const MINUTES_PER_DAY = 1440;

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

export type MinutesToTimeInput = { minutes: number };

/** Minutes after midnight as `HH:mm`, wrapped into one day. */
export function minutesToTime({ minutes }: MinutesToTimeInput): string {
  const day = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad({ value: Math.floor(day / 60) })}:${pad({ value: day % 60 })}`;
}

export type ParseTimeTextInput = { text: string };

const SEPARATED = /^(\d{1,2})[:.\s](\d{1,2})$/;
const DIGITS = /^\d{1,4}$/;

/** Hours and minutes from `9`, `930`, `0930`, `9:30` or `9.30`; null when not a time. */
function hoursAndMinutes({ text }: ParseTimeTextInput): [number, number] | null {
  const separated = SEPARATED.exec(text);
  if (separated) return [Number(separated[1]), Number(separated[2])];
  if (!DIGITS.test(text)) return null;
  if (text.length <= 2) return [Number(text), 0];
  const split = text.length - 2;
  return [Number(text.slice(0, split)), Number(text.slice(split))];
}

/** Typed text as a `HH:mm` time of day, or null when it is not one (empty is null too). */
export function parseTimeText({ text }: ParseTimeTextInput): string | null {
  const parts = hoursAndMinutes({ text: text.trim() });
  if (!parts) return null;
  const [hours, minutes] = parts;
  if (hours > 23 || minutes > 59) return null;
  return `${pad({ value: hours })}:${pad({ value: minutes })}`;
}

export type StepTimeInput = { value: string; minutes: number };

/** `value` moved by `minutes` and snapped to that step (ArrowUp/ArrowDown); empty starts at 08:00. */
export function stepTime({ value, minutes }: StepTimeInput): string {
  const time = parseTimeText({ text: value });
  if (!time) return "08:00";
  const [hours = 0, mins = 0] = time.split(":").map(Number);
  const total = hours * 60 + mins;
  const step = Math.abs(minutes);
  const snapped = minutes > 0 ? Math.floor(total / step) * step : Math.ceil(total / step) * step;
  return minutesToTime({ minutes: snapped + minutes });
}
