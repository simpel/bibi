import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadApiKey } from "@/features/api-key/load-api-key";
import { ApiKeyUpdatePage } from "@/features/api-key/ui/api-key-update-page";
import { entityTitle } from "@/lib/page-metadata";

type UpdateApiKeyPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateApiKeyPageProps) {
  const { id } = await params;
  const res = await loadApiKey({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "API Key",
    prefix: "Edit",
  });
}

export default async function UpdateApiKeyPage({ params }: UpdateApiKeyPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <ApiKeyUpdatePage locale={locale} id={id} />
    </SimplePage>
  );
}
