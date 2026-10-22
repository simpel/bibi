import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/features/auth/ui/auth-card";
import { LoginTabs } from "@/features/auth/ui/login-tabs";
import { Link } from "@/lib/navigation";
import { ROUTES, withNext } from "@/lib/routes";
import { safePath } from "@/lib/safe-redirect";
import { redirectIfSignedIn } from "@/server/auth-pages";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; sig?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { next, sig } = await searchParams;
  setRequestLocale(locale);
  if (!sig) await redirectIfSignedIn({ locale });
  const t = await getTranslations("auth");
  const target = safePath({ value: next, fallback: ROUTES.home });
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
      <LoginTabs next={target} />
    </AuthCard>
  );
}
