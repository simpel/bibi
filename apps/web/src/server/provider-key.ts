import { type ProviderKey, ProviderKeySchema } from "@bibi/core";

/** A provider's key from its URL segment (`/api/providers/fortnox/...`); null for anything else. */
export function providerKeyOf({ segment }: { segment: string }): ProviderKey | null {
  const parsed = ProviderKeySchema.safeParse(segment.toUpperCase());
  return parsed.success ? parsed.data : null;
}
