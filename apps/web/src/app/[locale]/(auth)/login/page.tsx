import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/features/auth/ui/auth-card";
import { MagicLinkForm } from "@/features/auth/ui/magic-link-form";
import { OAuthResume } from "@/features/auth/ui/oauth-resume";
import { Link } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";
import { ROUTES, withNext } from "@/lib/routes";
import { safePath } from "@/lib/safe-redirect";
import { redirectIfSignedIn } from "@/server/auth-pages";
import { getSessionState } from "@/server/session";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; sig?: string; prompt?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "auth", key: "signInTitle" });
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { next, sig, prompt } = await searchParams;
  setRequestLocale(locale);
  if (!sig) await redirectIfSignedIn({ locale });
  // A magic link inside an OAuth flow lands here signed in: resume the flow (ADR 0005). Not when
  // the client asked for a fresh login (`prompt=login`): authorize would send us straight back.
  const resume =
    Boolean(sig) &&
    !prompt?.split(" ").includes("login") &&
    (await getSessionState()).status !== "anonymous";
  const t = await getTranslations("auth");
  const target = safePath({ value: next, fallback: ROUTES.app });
  return (
    <AuthCard
      title={t("signInTitle")}
      description={t("signInDescription")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link
            href={withNext({ path: ROUTES.signUp, next: target })}
            className="text-primary hover:underline"
          >
            {t("signUp")}
          </Link>
        </>
      }
    >
      {resume ? <OAuthResume /> : <MagicLinkForm next={target} />}
    </AuthCard>
  );
}
