import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadCustomer } from "@/features/customer/load-customer";
import { CustomerUpdate } from "@/features/customer/ui/customer-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateCustomerPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateCustomerPageProps) {
  const { id } = await params;
  const customer = await loadCustomer({ id });
  return entityTitle({
    name: customer.ok ? customer.value.name : null,
    fallback: "Customer",
    prefix: "Edit",
  });
}

export default async function UpdateCustomerPage({ params }: UpdateCustomerPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="customer:write">
        <CustomerUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
