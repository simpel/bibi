import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ItemStatePage } from "@/features/item-state/ui/item-state-page";

type NewItemStatePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function NewItemStatePage({ params, searchParams }: NewItemStatePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { type = "" } = await searchParams;
  return <ItemStatePage locale={locale} mode={{ create: type }} />;
}
