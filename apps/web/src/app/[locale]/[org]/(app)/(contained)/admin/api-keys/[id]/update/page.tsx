import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { ApiKeyUpdatePage } from "@/features/api-key/ui/api-key-update-page";

type UpdateApiKeyPageProps = { params: Promise<{ locale: string; id: string }> };

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
