import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { CustomerUpdate } from "@/features/customer/ui/customer-update";

type UpdateCustomerPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateCustomerPage({ params }: UpdateCustomerPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <CustomerUpdate locale={locale} id={id} />;
}
