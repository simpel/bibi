/** Whether `value` is exactly an https origin (`https://host[:port]`, no path). */
function isHttpsOrigin({ value }: { value: string }): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value;
  } catch {
    return false;
  }
}

/**
 * The booking pages' `Content-Security-Policy` (ADR 0119): framed by this app and the sites the
 * organization listed. Anything but an exact https origin is dropped, so a stored value can never
 * widen or break the header.
 */
export function frameAncestors({ origins }: { origins: readonly string[] }): string {
  const allowed = [...new Set(origins.filter((value) => isHttpsOrigin({ value })))];
  return ["frame-ancestors 'self'", ...allowed].join(" ");
}
