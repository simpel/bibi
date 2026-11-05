import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { MemberList } from "@/features/member/ui/member-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type MembersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata({ params }: MembersPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "members" });
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <MemberList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
