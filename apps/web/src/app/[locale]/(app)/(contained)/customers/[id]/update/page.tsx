import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { CustomerUpdate } from "@/features/customer/ui/customer-update";

type UpdateCustomerPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateCustomerPage({ params }: UpdateCustomerPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="customer:edit">
      <CustomerUpdate locale={locale} id={id} />
    </PermissionGate>
  );
}
