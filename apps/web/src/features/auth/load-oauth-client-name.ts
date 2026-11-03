import "server-only";
import { getAuth } from "@bibi/auth";
import { headers } from "next/headers";
import { z } from "zod";

const PublicClientSchema = z.object({ client_name: z.string().optional() });

/** Display name of the OAuth client asking for consent (public client metadata), if any. */
export async function loadOAuthClientName({
  clientId,
}: {
  clientId: string | null;
}): Promise<string | null> {
  if (!clientId) return null;
  const data = await getAuth()
    .api.getOAuthClientPublic({ query: { client_id: clientId }, headers: await headers() })
    .catch(() => null);
  const parsed = PublicClientSchema.safeParse(data);
  return parsed.success ? (parsed.data.client_name ?? null) : null;
}
