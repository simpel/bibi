import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { CreateHub } from "@/components/create-hub/create-hub";
import { pageTitle } from "@/lib/page-metadata";

type NewPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "createHub", key: "title" });
}

export default async function NewPage({ params }: NewPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <SimplePage>
      <CreateHub />
    </SimplePage>
  );
}
