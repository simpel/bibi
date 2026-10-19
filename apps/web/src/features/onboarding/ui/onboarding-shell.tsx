import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AssistantProvider } from "@/features/assistant/state/assistant-provider";
import { SkipOnboardingButton } from "./skip-onboarding-button";

/** Wordmark top-left, "Skip for now" top-right (remembered on the user), the page fills the rest. */
export function OnboardingShell({ children }: { children: ReactNode }) {
  const common = useTranslations("common");
  return (
    <AssistantProvider>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
          <span className="font-serif text-xl font-semibold">{common("appName")}</span>
          <SkipOnboardingButton />
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </AssistantProvider>
  );
}
