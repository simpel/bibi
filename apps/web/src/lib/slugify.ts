export type SlugifyInput = { name: string; suffix: string };

/** URL-safe organization slug: lowercase ASCII words + a short unique suffix. */
export function slugify({ name, suffix }: SlugifyInput): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return [base || "org", suffix].join("-");
}
