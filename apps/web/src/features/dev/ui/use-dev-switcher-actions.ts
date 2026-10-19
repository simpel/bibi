"use client";

import type { DevUser } from "@okazi/auth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToastAction } from "@/lib/use-toast-action";
import { reseedDevDatabaseAction, resetDevOnboardingAction, switchDevUserAction } from "../actions";

/** Menu open state plus the switch, reset onboarding and reseed actions; each closes the menu first. */
export function useDevSwitcherActions() {
  const t = useTranslations("dev");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [open, setOpen] = useState(false);
  const refresh = () => router.refresh();
  const switchTo = ({ user }: { user: DevUser }) => {
    setOpen(false);
    return run({
      action: () => switchDevUserAction({ userId: user.id }),
      messages: { pending: t("switching"), success: t("switched", { name: user.name }) },
      onSuccess: refresh,
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
  return { open, setOpen, pending, switchTo, resetOnboarding, reseed };
}
