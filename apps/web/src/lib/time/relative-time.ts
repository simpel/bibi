import type { useFormatter } from "next-intl";

export type RelativeTimeInput = {
  format: ReturnType<typeof useFormatter>;
  instant: Date;
  now: Date;
};

/** "3 days ago" for `instant` as seen at `now`. The one place that calls `format.relativeTime`. */
export function relativeTime({ format, instant, now }: RelativeTimeInput): string {
  return format.relativeTime(instant, now);
}
