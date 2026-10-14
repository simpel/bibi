"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const PublicClientSchema = z.object({ client_name: z.string().optional() });

export type UseOAuthClientNameInput = { clientId: string | null };

/** Display name of the OAuth client asking for consent (public client metadata). */
export function useOAuthClientName({ clientId }: UseOAuthClientNameInput): string | undefined {
  const [name, setName] = useState<string>();
  useEffect(() => {
    if (!clientId) return;
    authClient.oauth2.publicClient({ query: { client_id: clientId } }).then(({ data }) => {
      const parsed = PublicClientSchema.safeParse(data);
      if (parsed.success) setName(parsed.data.client_name);
    });
  }, [clientId]);
  return name;
}
