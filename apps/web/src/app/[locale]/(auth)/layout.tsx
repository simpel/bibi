import { Wordmark } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

/** Wordmark above the centered auth card. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const common = await getTranslations("common");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Wordmark size="xl" label={common("appName")} />
      {children}
    </main>
  );
}
