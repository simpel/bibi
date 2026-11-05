import { getEnv } from "@bibi/config";
import { resolveLocale } from "@bibi/i18n";
import { routing } from "@bibi/i18n/routing";
import type { Metadata } from "next";
import { Cherry_Bomb_One, Fraunces, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { DevUserSwitcherSlot } from "@/features/dev/ui/dev-user-switcher-slot";
import { pickSurfaceMessages, ROOT_NAMESPACES } from "@/i18n/surface-messages";
import { DisplayFormatsProvider } from "@/lib/time/display-formats-provider";
import { loadDisplayFormats } from "@/server/display-formats";
import "../globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const cherryBombOne = Cherry_Bomb_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cherry-bomb",
  display: "swap",
});

type LocaleLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: resolveLocale({ value: locale }),
    namespace: "common",
  });
  const appName = t("appName");
  return {
    title: {
      default: appName,
      template: `%s · ${appName}`,
    },
    metadataBase: new URL(getEnv().BETTER_AUTH_URL),
    openGraph: { siteName: appName, title: appName, type: "website", locale },
    twitter: { card: "summary_large_image", title: appName },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html
      lang={locale}
      className={`${sans.variable} ${serif.variable} ${cherryBombOne.variable} motion-safe:scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider
          messages={pickSurfaceMessages({ locale, namespaces: ROOT_NAMESPACES })}
        >
          <DisplayFormatsProvider formats={await loadDisplayFormats()}>
            <Providers>{children}</Providers>
            <DevUserSwitcherSlot />
          </DisplayFormatsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
