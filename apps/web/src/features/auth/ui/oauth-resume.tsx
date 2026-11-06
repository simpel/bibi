"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * A magic link opened inside an OAuth authorize flow returns here signed in, with the signed
 * query in the URL. Resume authorize; Better Auth's client follows the redirect to the next step
 * (organization, consent or the client). Why: ADR 0005, addendum 2026-11-06.
 */
export function OAuthResume() {
  const t = useTranslations("auth");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void authClient.oauth2.continue({ postLogin: true });
  }, []);
  return <output className="block text-muted-foreground">{t("continuingSignIn")}</output>;
}
