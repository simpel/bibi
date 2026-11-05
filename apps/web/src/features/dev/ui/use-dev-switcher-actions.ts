"use client";

import type { DevUser } from "@bibi/auth";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { reseedDevDatabaseAction, resetDevOnboardingAction, switchDevUserAction } from "../actions";

/** Menu open state plus the switch, reset onboarding, reseed and log out actions; each closes the menu first. */
export function useDevSwitcherActions() {
  const t = useTranslations("dev");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const locale = useLocale();
  const refresh = () => router.refresh();
  // The other user's active organization decides the slug: reload from the locale root.
  const reopen = () => window.location.assign(`/${locale}`);
  const switchTo = ({ user }: { user: DevUser }) => {
    setOpen(false);
    return run({
      action: () => switchDevUserAction({ userId: user.id }),
      messages: { pending: t("switching"), success: t("switched", { name: user.name }) },
      onSuccess: reopen,
    });
  };
  const resetOnboarding = ({ user }: { user: DevUser }) => {
    setOpen(false);
    return run({
      action: () => resetDevOnboardingAction({ userId: user.id }),
      messages: {
        pending: t("resettingOnboarding"),
        success: t("onboardingReset", { name: user.name }),
      },
      onSuccess: refresh,
    });
  };
  const reseed = () =>
    run({
      action: reseedDevDatabaseAction,
      messages: { pending: t("reseeding"), success: t("reseeded") },
      onSuccess: refresh,
    });
  const signOut = async () => {
    setOpen(false);
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.replace(ROUTES.login);
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };
  return {
    open,
    setOpen,
    pending: pending || signingOut,
    switchTo,
    resetOnboarding,
    reseed,
    signOut,
  };
}
