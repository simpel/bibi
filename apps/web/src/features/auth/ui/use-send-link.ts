import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { hasOAuthQuery } from "@/lib/oauth-query";
import { useAuthFormAction } from "./use-auth-form-action";

export type SendLinkInput = { email: string; name?: string };

/**
 * Where the link lands: inside an OAuth authorize flow the login page with its signed query, so
 * it can resume the flow (ADR 0005); otherwise `next`.
 */
function linkTarget({ locale, next }: { locale: string; next: string }): string {
  const { search } = window.location;
  return hasOAuthQuery({ search }) ? `/${locale}/login${search}` : `/${locale}${next}`;
}

/** Mails a magic link (sign-in, or sign-up when the email is new) and remembers where it went. */
export function useSendLink({ next }: { next: string }) {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const locale = useLocale();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { pending, run } = useAuthFormAction();
  const send = ({ email, name }: SendLinkInput) =>
    run({
      call: () =>
        authClient.signIn.magicLink({
          email,
          ...(name ? { name } : {}),
          callbackURL: linkTarget({ locale, next }),
        }),
      messages: { pending: common("sending"), success: t("linkSent") },
      onSuccess: () => setSentTo(email),
    });
  return { sentTo, pending, send };
}
