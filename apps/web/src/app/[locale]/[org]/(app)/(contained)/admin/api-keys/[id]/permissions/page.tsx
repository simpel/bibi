import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadApiKey } from "@/features/api-key/load-api-key";
import { PermissionPage } from "@/features/permission/ui/permission-page";
import { entityTitle } from "@/lib/page-metadata";

type ApiKeyPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: ApiKeyPermissionsPageProps) {
  const { id } = await params;
  const res = await loadApiKey({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "API Key",
    prefix: "Permissions",
  });
}

export default async function ApiKeyPermissionsPage({ params }: ApiKeyPermissionsPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionPage locale={locale} subjectType="apiKey" subjectId={id} />
    </SimplePage>
  );
}
