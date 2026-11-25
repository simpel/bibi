"use client";

import { Button } from "@bibi/ui";
import { House, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { StatusPage } from "@/components/states/status-page";
import { Link, useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type ErrorPageProps = { error: Error & { digest?: string }; reset: () => void };

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for error boundaries.
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("errors.page");
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  // A server render that failed only renders again after a refresh; reset alone re-mounts the client.
  const retry = () =>
    startRetry(() => {
      router.refresh();
      reset();
    });
  return (
    <StatusPage
      code={t("serverError.code")}
      title={t("serverError.title")}
      description={t("serverError.description")}
      actions={
        <>
          <Button onClick={retry} disabled={retrying}>
            <RotateCw aria-hidden className={retrying ? "animate-spin" : undefined} />
            {t("retry")}
          </Button>
          <Button asChild variant="ghost">
            <Link href={ROUTES.app}>
              <House aria-hidden />
              {t("home")}
            </Link>
          </Button>
        </>
      }
      footnote={
        error.digest ? (
          <>
            <p className="tabular-nums">{t("reference", { digest: error.digest })}</p>
            <p>{t("referenceHint")}</p>
          </>
        ) : null
      }
    />
  );
}
