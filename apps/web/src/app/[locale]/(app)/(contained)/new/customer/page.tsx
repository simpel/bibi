import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { CustomerCreate } from "@/features/customer/ui/customer-create";

type NewCustomerPageProps = { params: Promise<{ locale: string }> };

export default async function NewCustomerPage({ params }: NewCustomerPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <CustomerCreate locale={locale} />;
}
