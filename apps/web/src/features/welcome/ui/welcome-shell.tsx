import { Wordmark } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** Full screen, logo at the top centre, the step centred below (ADR 0061). No app chrome. */
export function WelcomeShell({ children }: { children: ReactNode }) {
  const common = useTranslations("common");
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8 sm:py-12">
      <header className="flex shrink-0 justify-center pb-8 sm:pb-12">
        <Wordmark size="md" name={common("appName")}>
          {common("appName")}
        </Wordmark>
      </header>
      <main className="flex w-full flex-1 items-start justify-center sm:items-center">
        {children}
      </main>
    </div>
  );
}
