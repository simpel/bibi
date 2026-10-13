export const SKILL_SCOPES = ["SYSTEM", "ORGANIZATION", "PERSONAL"] as const;
export const SKILL_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type SkillFilters = {
  scope?: (typeof SKILL_SCOPES)[number] | undefined;
  status?: (typeof SKILL_STATUSES)[number] | undefined;
  q?: string | undefined;
  /** Rank by meaning with core `search` instead of the plain text filter. */
  semantic: boolean;
  cursor?: string | undefined;
};

type Raw = Record<string, string | string[] | undefined>;

const first = ({ value }: { value: string | string[] | undefined }) =>
  (Array.isArray(value) ? value[0] : value) || undefined;

const pick = <T extends string>({
  value,
  allowed,
}: {
  value: string | undefined;
  allowed: readonly T[];
}) => allowed.find((candidate) => candidate === value);

export type ParseSkillFiltersInput = { params: Raw };

/** `?scope=&status=&q=&semantic=1&cursor=` → validated filters (unknown values are ignored). */
export function parseSkillFilters({ params }: ParseSkillFiltersInput): SkillFilters {
  return {
    scope: pick({ value: first({ value: params.scope }), allowed: SKILL_SCOPES }),
    status: pick({ value: first({ value: params.status }), allowed: SKILL_STATUSES }),
    q: first({ value: params.q })?.trim().slice(0, 200) || undefined,
    semantic: first({ value: params.semantic }) === "1",
    cursor: first({ value: params.cursor }),
  };
}

/** Filters back to query parameters (for links that keep them, e.g. pagination). */
export function skillFilterQuery({ filters }: { filters: SkillFilters }): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.scope) query.scope = filters.scope;
  if (filters.status) query.status = filters.status;
  if (filters.q) query.q = filters.q;
  if (filters.semantic) query.semantic = "1";
  return query;
}
