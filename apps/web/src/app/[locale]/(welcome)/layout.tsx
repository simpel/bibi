import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { WelcomeShell } from "@/features/welcome/ui/welcome-shell";
import { requireAnySession } from "@/server/auth-pages";

type WelcomeLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** `/welcome` and `/welcome/new` (ADR 0061): signed in, no organization in the URL yet. */
export default async function WelcomeLayout({ children, params }: WelcomeLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  await requireAnySession({ locale });
  return <WelcomeShell>{children}</WelcomeShell>;
}
