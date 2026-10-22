import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { CustomerList } from "@/features/customer/ui/customer-list";
import { readCursor } from "@/lib/page-cursor";

type CustomersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function CustomersPage({ params, searchParams }: CustomersPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <CustomerList locale={locale} cursor={readCursor({ value: cursor })} />;
}
