import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { MemberList } from "@/features/member/ui/member-list";
import { readCursor } from "@/lib/page-cursor";

type MembersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <MemberList locale={locale} cursor={readCursor({ value: cursor })} />;
}
