import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { DepositCreate } from "@/features/deposit/ui/deposit-create";

type NewDepositPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ticket?: string | string[] }>;
};

export default async function NewDepositPage({ params, searchParams }: NewDepositPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  const { ticket } = await searchParams;
  if (typeof ticket !== "string" || ticket === "") notFound();
  return (
    <SimplePage>
      <PermissionGate permission="payment:write">
        <DepositCreate ticketId={ticket} />
      </PermissionGate>
    </SimplePage>
  );
}
