import { resolveLocale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DepositCreate } from "@/features/deposit/ui/deposit-create";
import { getCallerAbilities } from "@/server/caller-abilities";

type NewDepositPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ticket?: string | string[] }>;
};

export default async function NewDepositPage({ params, searchParams }: NewDepositPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  if (!(await getCallerAbilities()).paymentWrite) notFound();
  const { ticket } = await searchParams;
  if (typeof ticket !== "string" || ticket === "") notFound();
  return <DepositCreate ticketId={ticket} />;
}
