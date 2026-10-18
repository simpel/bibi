import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ResponsibilityUpdate } from "@/features/responsibility/ui/responsibility-update";

type UpdateResponsibilityPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateResponsibilityPage({ params }: UpdateResponsibilityPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <ResponsibilityUpdate locale={locale} id={id} />;
}
