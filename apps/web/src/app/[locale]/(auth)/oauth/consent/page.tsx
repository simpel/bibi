import { setRequestLocale } from "next-intl/server";
import { ConsentCard } from "@/features/auth/ui/consent-card";
import { requireAnySession } from "@/server/auth-pages";

type ConsentPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client_id?: string; scope?: string }>;
};

/** Better Auth's `consentPage`; the signed authorize query stays in the URL for the client. */
export default async function ConsentPage({ params, searchParams }: ConsentPageProps) {
  const { locale } = await params;
  const { client_id: clientId, scope } = await searchParams;
  setRequestLocale(locale);
  await requireAnySession({ locale });
  const scopes = scope ? scope.split(" ").filter(Boolean) : [];
  return <ConsentCard clientId={clientId ?? null} scopes={scopes} />;
}
