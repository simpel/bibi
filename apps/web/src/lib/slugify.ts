export type SlugifyInput = { name: string };

/**
 * The slug an organization name suggests (ADR 0062): lowercase ASCII words joined by dashes,
 * diacritics stripped (å, ä → a, ö → o), at most 40 characters. The server checks it.
 */
export function slugify({ name }: SlugifyInput): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}
