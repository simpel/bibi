import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ConsentCard } from "@/features/auth/ui/consent-card";
import { urlHost } from "@/lib/url-host";
import { requireAnySession } from "@/server/auth-pages";
import { loadConsentOrganizations } from "@/server/consent-organizations";

type ConsentPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client_id?: string; scope?: string; redirect_uri?: string }>;
};

/** Better Auth's `consentPage`; the signed authorize query stays in the URL for the client. */
export default async function ConsentPage({ params, searchParams }: ConsentPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { client_id: clientId, scope, redirect_uri: redirectUri } = await searchParams;
  setRequestLocale(locale);
  await requireAnySession({ locale });
  const scopes = scope ? scope.split(" ").filter(Boolean) : [];
  return (
    <ConsentCard
      clientId={clientId ?? null}
      scopes={scopes}
      redirectHost={urlHost({ value: redirectUri })}
      {...(await loadConsentOrganizations())}
    />
  );
}
