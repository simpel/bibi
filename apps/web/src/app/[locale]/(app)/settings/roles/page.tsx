import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { RoleList } from "@/features/role/ui/role-list";
import { readCursor } from "@/lib/page-cursor";

type RolesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function RolesPage({ params, searchParams }: RolesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <RoleList locale={locale} cursor={readCursor({ value: cursor })} />;
}
