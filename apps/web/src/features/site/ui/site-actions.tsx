import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getSessionState } from "@/server/session";

export type SiteActionsProps = {
  locale: string;
  appUrl: string;
  size?: "default" | "lg";
  /** `inverse` sits on the dark call-to-action band. */
  tone?: "default" | "inverse";
};

/** Signed in: one "To the app" button. Otherwise log in and sign up. Both leave for the app host. */
export async function SiteActions({
  locale,
  appUrl,
  size = "default",
  tone = "default",
}: SiteActionsProps) {
  const t = await getTranslations("site");
  const state = await getSessionState();
  const inverse = tone === "inverse";
  const primary = inverse ? "secondary" : "default";
  if (state.status === "anonymous") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          asChild
          size={size}
          variant={inverse || size === "lg" ? "outline" : "ghost"}
          className={inverse ? "border-background/30 bg-transparent text-background" : undefined}
        >
          <a href={`${appUrl}/${locale}/login`}>{t("login")}</a>
        </Button>
        <Button asChild size={size} variant={primary}>
          <a href={`${appUrl}/${locale}/sign-up`}>{t("signUp")}</a>
        </Button>
      </div>
    );
  }
  const path = state.status === "ready" ? state.organizationSlug : "welcome";
  return (
    <Button asChild size={size} variant={primary}>
      <a href={`${appUrl}/${locale}/${path}`}>{t("toApp")}</a>
    </Button>
  );
}
