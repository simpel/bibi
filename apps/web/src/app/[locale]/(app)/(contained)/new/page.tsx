import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { CreateHub } from "@/components/create-hub/create-hub";

type NewPageProps = { params: Promise<{ locale: string }> };

export default async function NewPage({ params }: NewPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <CreateHub />;
}
