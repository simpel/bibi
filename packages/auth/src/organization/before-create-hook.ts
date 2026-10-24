import type { Db } from "@bibi/db";
import { creationTimeZone } from "./creation-time-zone";
import { enforceSlugHook } from "./enforce-slug-hook";

export type BeforeCreateInput = {
  organization: { slug?: string; metadata?: Record<string, unknown> } & Record<string, unknown>;
};

/**
 * `beforeCreateOrganization`: refuses a bad slug (ADR 0062) or a missing or unknown time zone
 * (ADR 0064), and keeps only the zone in `metadata` for `afterCreateOrganization`.
 */
export function beforeCreateOrganizationHook({ db }: { db: Db }) {
  const enforceSlug = enforceSlugHook({ db });
  return async ({ organization }: BeforeCreateInput) => {
    const timeZone = creationTimeZone({ metadata: organization.metadata });
    await enforceSlug({ organization });
    return { data: { ...organization, metadata: { timeZone } } };
  };
}
