import { resolveLocale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/features/auth/ui/auth-card";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";
import { ROUTES, withNext } from "@/lib/routes";
import { safePath } from "@/lib/safe-redirect";
import { redirectIfSignedIn } from "@/server/auth-pages";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { next } = await searchParams;
  setRequestLocale(locale);
  await redirectIfSignedIn({ locale });
  const t = await getTranslations("auth");
  const target = safePath({ value: next, fallback: ROUTES.venues });
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
