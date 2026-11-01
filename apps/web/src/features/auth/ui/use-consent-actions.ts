import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useAuthFormAction } from "./use-auth-form-action";

export type UseConsentActionsInput = { organizationId: string | null };

/**
 * Allow and deny on the consent page. Allow first makes the picked organization active, because
 * the token Better Auth issues carries the session's active organization (`consentReferenceId`).
 */
export function useConsentActions({ organizationId }: UseConsentActionsInput) {
  const t = useTranslations("auth");
  const { pending, run } = useAuthFormAction();
  const allow = () =>
    run({
      call: async () => {
        const active = await authClient.organization.setActive({ organizationId });
        return active.error ? active : authClient.oauth2.consent({ accept: true });
      },
      messages: { pending: t("consentAllowing"), success: t("consentAllowed") },
      onSuccess: () => undefined,
    });
  const deny = () =>
    run({
      call: () => authClient.oauth2.consent({ accept: false }),
      messages: { pending: t("consentDenying"), success: t("consentDenied") },
      onSuccess: () => undefined,
    });
  return { pending, allow, deny };
}
