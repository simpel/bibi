import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type AuthClientError, authErrorKey } from "@/lib/auth-error-key";
import { submitWithToast, type ToastOutcome } from "@/lib/submit-with-toast";
import type { FormActionMessages } from "@/lib/use-form-action";

/** What every Better Auth client call returns, reduced to what we read. */
export type AuthCallResult = { error: AuthClientError | null };

export type RunAuthInput = {
  call: () => Promise<AuthCallResult>;
  messages: FormActionMessages;
  onSuccess: () => void | Promise<void>;
};

/**
 * Auth forms in the one-toast-per-process flow (CLAUDE.md "Formulär"). The documented exception
 * to "always server actions": auth calls the Better Auth client, because its OAuth provider
 * plugin carries the signed authorize query (`sig`) and redirects to the next OAuth step.
 */
export function useAuthFormAction() {
  const t = useTranslations("errors");
  const [pending, setPending] = useState(false);
  const attempt = async ({ call }: Pick<RunAuthInput, "call">): Promise<ToastOutcome<null>> => {
    try {
      const { error } = await call();
      return error ? { ok: false, message: t(authErrorKey({ error })) } : { ok: true, value: null };
    } catch {
      return { ok: false, message: t("network") };
    }
  };
  const run = async ({ call, messages, onSuccess }: RunAuthInput): Promise<void> => {
    setPending(true);
    try {
      const outcome = await submitWithToast({ toast, messages, run: () => attempt({ call }) });
      // Outside the toast process on purpose: an OAuth redirect may never resolve. A failure after
      // success (navigation, oauth2.continue) still surfaces as a persistent error toast.
      if (outcome.ok) await onSuccess();
    } catch {
      toast.error(t("generic"), { duration: Number.POSITIVE_INFINITY, closeButton: true });
    } finally {
      setPending(false);
    }
  };
  return { pending, run };
}
