import type { Db } from "@bibi/db";
import { APIError } from "better-auth/api";
import { checkOrganizationSlug } from "./check-slug";

export type EnforceSlugHookInput = { organization: { slug?: string } };

/**
 * `beforeCreateOrganization` (ADR 0062): refuses a slug that is invalid, reserved or taken, so a
 * race between the live check and create ends in a clear message instead of a unique violation.
 */
export function enforceSlugHook({ db }: { db: Db }) {
  return async ({ organization }: EnforceSlugHookInput): Promise<void> => {
    const check = await checkOrganizationSlug({ db, slug: organization.slug ?? "" });
    if (check.status === "free") return;
    throw new APIError("BAD_REQUEST", {
      code: `SLUG_${check.status.toUpperCase()}`,
      message: `Slug ${check.status}`,
      suggestion: check.suggestion,
    });
  };
}
