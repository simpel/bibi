import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ResponsibilityCreate } from "@/features/responsibility/ui/responsibility-create";

type NewResponsibilityPageProps = { params: Promise<{ locale: string }> };

export default async function NewResponsibilityPage({ params }: NewResponsibilityPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <ResponsibilityCreate locale={locale} />;
}
