"use client";

import { useState } from "react";
import { type AuthClientError, type AuthErrorKey, authErrorKey } from "@/lib/auth-error-key";

/** What every Better Auth client call returns, reduced to what we read. */
export type AuthCallResult = { error: AuthClientError | null };

export type RunAuthInput = {
  call: () => Promise<AuthCallResult>;
  onSuccess: () => void | Promise<void>;
};

/** Pending + localized error state around one Better Auth client call. */
export function useAuthSubmit() {
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);

  const run = async ({ call, onSuccess }: RunAuthInput): Promise<void> => {
    setPending(true);
    setErrorKey(null);
    try {
      const { error } = await call();
      if (error) setErrorKey(authErrorKey({ error }));
      else await onSuccess();
    } catch {
      setErrorKey("generic");
    } finally {
      setPending(false);
    }
  };

  return { pending, errorKey, run };
}
