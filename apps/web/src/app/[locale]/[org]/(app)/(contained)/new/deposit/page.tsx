import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { DepositCreate } from "@/features/deposit/ui/deposit-create";
import { pageTitle } from "@/lib/page-metadata";

type NewDepositPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
};

export async function generateMetadata({ params }: NewDepositPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "deposit", key: "create" });
}

export default async function NewDepositPage({ params, searchParams }: NewDepositPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  const { order } = await searchParams;
  if (typeof order !== "string" || order === "") notFound();
  return (
    <SimplePage>
      <PermissionGate permission="payment:write">
        <DepositCreate orderId={order} />
      </PermissionGate>
    </SimplePage>
  );
}
