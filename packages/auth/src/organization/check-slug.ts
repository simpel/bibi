import { type Db, getDb } from "@bibi/db";
import { isReservedSlug } from "./reserved-slugs";

/** Lowercase a–z, 0–9 and `-`, 3–40 characters, no dash at either end (ADR 0062). */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export type SlugStatus = "free" | "taken" | "reserved" | "invalid";

export type SlugCheck = {
  slug: string;
  status: SlugStatus;
  /** The first free `<slug>-2…-n`; null when the slug is free or cannot be repaired. */
  suggestion: string | null;
};

export type CheckOrganizationSlugInput = {
  slug: string;
  /** Defaults to the process database; tests and Better Auth hooks pass their own. */
  db?: Db;
};

/** Whether an organization may take `slug`, and the first free alternative if not. */
export async function checkOrganizationSlug({
  db = getDb(),
  slug,
}: CheckOrganizationSlugInput): Promise<SlugCheck> {
  if (!SLUG_PATTERN.test(slug)) return { slug, status: "invalid", suggestion: null };
  const taken = await takenSlugs({ db, base: slug });
  const reserved = isReservedSlug({ slug });
  if (!reserved && !taken.has(slug)) return { slug, status: "free", suggestion: null };
  return {
    slug,
    status: reserved ? "reserved" : "taken",
    suggestion: firstFree({ base: slug, taken }),
  };
}

type TakenSlugsInput = { db: Db; base: string };

async function takenSlugs({ db, base }: TakenSlugsInput): Promise<ReadonlySet<string>> {
  const rows = await db.organization.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  return new Set(rows.map((row) => row.slug));
}

type FirstFreeInput = { base: string; taken: ReadonlySet<string> };

function firstFree({ base, taken }: FirstFreeInput): string | null {
  for (let n = 2; n <= taken.size + 2; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, 40 - suffix.length).replace(/-+$/, "")}${suffix}`;
    if (!taken.has(candidate) && !isReservedSlug({ slug: candidate })) return candidate;
  }
  return null;
}
