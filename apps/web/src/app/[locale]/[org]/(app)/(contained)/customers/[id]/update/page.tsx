import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { CustomerUpdate } from "@/features/customer/ui/customer-update";

type UpdateCustomerPageProps = { params: Promise<{ locale: string; id: string }> };

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
