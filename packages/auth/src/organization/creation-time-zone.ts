import { TimeZoneSchema } from "@bibi/core/schemas";
import { APIError } from "better-auth/api";
import { z } from "zod";

/**
 * What `organization.create` carries in `metadata` (ADR 0064 decision 3a). The zone only passes
 * through: `afterCreateOrganization` stores it on the profile and clears `metadata`, so the profile
 * stays the one place the zone lives.
 */
const CreationMetadataSchema = z.object({ timeZone: TimeZoneSchema });

export type CreationMetadataInput = { metadata: unknown };

const parsed = ({ metadata }: CreationMetadataInput): unknown => {
  if (typeof metadata !== "string") return metadata;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
};

/** The IANA zone from the create call's `metadata`; `BAD_REQUEST` when missing or unknown. */
export function creationTimeZone({ metadata }: CreationMetadataInput): string {
  const result = CreationMetadataSchema.safeParse(parsed({ metadata }));
  if (result.success) return result.data.timeZone;
  throw new APIError("BAD_REQUEST", {
    code: "TIME_ZONE_INVALID",
    message: "metadata.timeZone must be a known IANA time zone",
  });
}
