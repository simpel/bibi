import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { CustomerCreate } from "@/features/customer/ui/customer-create";

type NewCustomerPageProps = { params: Promise<{ locale: string }> };

export default async function NewCustomerPage({ params }: NewCustomerPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="customer:write">
        <CustomerCreate locale={locale} />
      </PermissionGate>
    </SimplePage>
  );
}
