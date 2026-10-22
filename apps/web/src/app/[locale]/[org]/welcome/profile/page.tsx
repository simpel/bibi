import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { ProfileForm } from "@/features/welcome/ui/profile/profile-form";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { requireReadySession } from "@/server/guard";

type ProfileStepProps = { params: Promise<{ locale: string; org: string }> };

/** Name, phone and photo (ADR 0061); the sign-up name prefills first and last name. */
export default async function ProfileStep({ params }: ProfileStepProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  const [state, { session }, t] = await Promise.all([
    loadStepState({ locale }),
    requireReadySession({ locale }),
    getTranslations("welcome.profile"),
  ]);
  const [given = "", ...rest] = session.user.name.trim().split(/\s+/);
  const { profile } = state;
  const defaults = {
    firstName: profile.firstName ?? given,
    lastName: profile.lastName ?? rest.join(" "),
    phone: profile.phone ?? "",
    avatarKey: profile.avatarKey,
  };
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "profile", state })}
    >
      <ProfileForm org={org} defaults={defaults} />
    </WelcomeStepFrame>
  );
}
