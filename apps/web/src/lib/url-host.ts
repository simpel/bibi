export type UrlHostInput = { value: string | null | undefined };

/** The host of an absolute URL (`claude.ai`, `127.0.0.1:61000`), or `null` when it is not one. */
export function urlHost({ value }: UrlHostInput): string | null {
  if (!value) return null;
  try {
    return new URL(value).host || null;
  } catch {
    return null;
  }
}
