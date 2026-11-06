import { getEnv } from "@bibi/config";
import { resolveLocale } from "@bibi/i18n";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadGuideLinks } from "@/features/support/server/guide-links";
import { loadSupportTopics } from "@/features/support/server/support-topics";
import { SupportHome } from "@/features/support/ui/support-home";

type SupportRouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: SupportRouteProps): Promise<Metadata> {
  const locale = resolveLocale({ value: (await params).locale });
  const t = await getTranslations({ locale, namespace: "support" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Public support start page: common questions, guides and contact. */
export default async function SupportRoute({ params }: SupportRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [topics, guides] = await Promise.all([
    loadSupportTopics({ locale }),
    loadGuideLinks({ locale }),
  ]);
  return <SupportHome topics={topics} guides={guides} email={getEnv().SUPPORT_EMAIL} />;
}
