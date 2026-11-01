import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { MemberDetail } from "@/features/member/ui/member-detail";

type MemberPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function MemberPage({ params }: MemberPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <MemberDetail locale={locale} id={id} />
    </SimplePage>
  );
}
