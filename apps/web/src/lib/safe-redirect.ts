export type SafePathInput = { value: string | null | undefined; fallback: string };

/** Only same-site relative paths may be used as `next` targets (blocks open redirects). */
export function safePath({ value, fallback }: SafePathInput): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
