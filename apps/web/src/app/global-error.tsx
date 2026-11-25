"use client";

import { FATAL_MESSAGES } from "@bibi/i18n/fatal";
import { type Locale, resolveLocale } from "@bibi/i18n/routing";
import { Button } from "@bibi/ui";
import { LifeBuoy, RotateCw } from "lucide-react";
import { useParams } from "next/navigation";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { StatusPage } from "@/components/states/status-page";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import "./globals.css";

type GlobalErrorProps = { error: Error & { digest?: string } };

/**
 * Shown when the root layout itself fails. It replaces that layout, so it renders its own `<html>`
 * and an intl provider that only carries the locale (for links); texts come from `FATAL_MESSAGES`.
 */
// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for global-error.
export default function GlobalError({ error }: GlobalErrorProps) {
  const params = useParams<{ locale?: string }>();
  const locale = resolveLocale({ value: params?.locale });
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale}>
          <FatalPage locale={locale} digest={error.digest} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

type FatalPageProps = { locale: Locale; digest?: string };

function FatalPage({ locale, digest }: FatalPageProps) {
  // Its own translator: `fatal` is not part of the app's typed catalog (see `@bibi/i18n/fatal`).
  const t = createTranslator({ locale, messages: FATAL_MESSAGES[locale], namespace: "fatal" });
  return (
    <StatusPage
      code={t("code")}
      title={t("title")}
      description={t("description")}
      actions={
        <>
          {/* The root layout failed, so only a full reload starts it again. */}
          <Button onClick={() => window.location.reload()}>
            <RotateCw aria-hidden />
            {t("reload")}
          </Button>
          <Button asChild variant="ghost">
            <Link href={ROUTES.support}>
              <LifeBuoy aria-hidden />
              {t("help")}
            </Link>
          </Button>
        </>
      }
      footnote={
        digest ? (
          <>
            <p className="tabular-nums">{t("reference", { digest })}</p>
            <p>{t("referenceHint")}</p>
          </>
        ) : null
      }
    />
  );
}
