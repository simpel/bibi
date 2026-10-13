export type SlugifyInput = { text: string };

/** `Skapa anläggning & rum` → `skapa-anlaggning-rum`; max 64 chars, never empty. */
export function slugify({ text }: SlugifyInput): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 64)
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "skill" : slug;
}
