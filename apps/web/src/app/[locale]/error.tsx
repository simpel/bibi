"use client";

import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";

type ErrorPageProps = { reset: () => void };

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for error boundaries.
export default function ErrorPage({ reset }: ErrorPageProps) {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t("generic")}</h1>
      <Button onClick={reset}>{common("retry")}</Button>
    </main>
  );
}
