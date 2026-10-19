import { Link } from "@okazi/i18n/navigation";
import { buttonVariants } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AssistantProvider } from "@/features/assistant/state/assistant-provider";
import { ROUTES } from "@/lib/routes";

/** Wordmark top-left, "Skip for now" top-right (goes home), the page fills the rest. */
export function OnboardingShell({ children }: { children: ReactNode }) {
  const t = useTranslations("onboarding");
  const common = useTranslations("common");
  return (
    <AssistantProvider>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
          <span className="font-serif text-xl font-semibold">{common("appName")}</span>
          <Link href={ROUTES.home} className={buttonVariants({ variant: "ghost" })}>
            {t("skip")}
          </Link>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </AssistantProvider>
  );
}
