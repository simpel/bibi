import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { MemberDetail } from "@/features/member/ui/member-detail";
import { entityTitle } from "@/lib/page-metadata";
import { loadMember } from "@/server/load-member";

type MemberPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: MemberPageProps) {
  const { id } = await params;
  const res = await loadMember({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Member",
  });
}

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
