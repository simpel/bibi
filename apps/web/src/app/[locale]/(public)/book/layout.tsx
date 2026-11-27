import { resolveLocale } from "@bibi/i18n";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { BOOKING_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";

type BookLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** The guest booking pages (ADR 0119): no session, no app shell, only the booking words. */
export default async function BookLayout({ children, params }: BookLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <NextIntlClientProvider
      messages={pickSurfaceMessages({ locale, namespaces: BOOKING_NAMESPACES })}
    >
      {children}
    </NextIntlClientProvider>
  );
}
