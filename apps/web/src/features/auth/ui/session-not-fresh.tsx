"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { ROUTES, withNext } from "@/lib/routes";

/** In place of the session list when the sign-in is too old to list sessions: sign in again. */
export function SessionNotFresh() {
  const t = useTranslations("profile");
  const router = useRouter();
  const signInAgain = async () => {
    await authClient.signOut();
    router.replace(withNext({ path: ROUTES.login, next: ROUTES.profile }));
    router.refresh();
  };
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("sessionsNotFresh")}</p>
      <Button type="button" variant="outline" onClick={signInAgain} className="justify-self-start">
        {t("signInAgain")}
      </Button>
    </div>
  );
}
