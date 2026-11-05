import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/features/auth/ui/auth-card";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";
import { Link } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";
import { ROUTES, withNext } from "@/lib/routes";
import { safePath } from "@/lib/safe-redirect";
import { redirectIfSignedIn } from "@/server/auth-pages";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "auth", key: "signUpTitle" });
}

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { next } = await searchParams;
  setRequestLocale(locale);
  await redirectIfSignedIn({ locale });
  const t = await getTranslations("auth");
  const target = safePath({ value: next, fallback: ROUTES.home });
  return (
    <AuthCard
      title={t("signUpTitle")}
      description={t("signUpDescription")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link
            href={withNext({ path: ROUTES.login, next: target })}
            className="text-primary hover:underline"
          >
            {t("signIn")}
          </Link>
        </>
      }
    >
      <SignUpForm next={target} />
    </AuthCard>
  );
}
