import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadCustomer } from "@/features/customer/load-customer";
import { CustomerDetail } from "@/features/customer/ui/customer-detail";
import { entityTitle } from "@/lib/page-metadata";

type CustomerPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: CustomerPageProps) {
  const { id } = await params;
  const customer = await loadCustomer({ id });
  return entityTitle({
    name: customer.ok ? customer.value.name : null,
    fallback: "Customer",
  });
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <CustomerDetail locale={locale} id={id} />
    </SimplePage>
  );
}
