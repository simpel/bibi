"use client";

import { PermissionProfileCard } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { apiKeyPermissionsRoute, memberPermissionsRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { buildPermissionModel } from "./permission-profile-model";

export type PermissionProfileCardViewProps = GenerativeProps<"permission-profile-card">;

/** A member's or API key's preset, overrides and effective access, linking to the grid page. */
export function PermissionProfileCardView({ profile }: PermissionProfileCardViewProps) {
  const t = useTranslations("permissions");
  const role = useTranslations("role");
  const model = buildPermissionModel({
    profile,
    feature: (key) => t(`features.${key}`),
    action: (key) => t(`actions.${key}`),
  });
  const href =
    profile.subjectType === "member"
      ? memberPermissionsRoute({ id: profile.subjectId })
      : apiKeyPermissionsRoute({ id: profile.subjectId });
  return (
    <PermissionProfileCard
      presetTitle={t("preset")}
      preset={role(profile.preset ?? "unknown")}
      allowedTitle={t("card.allowed")}
      deniedTitle={t("card.denied")}
      noOverrides={t("card.noOverrides")}
      effectiveTitle={t("card.effective")}
      hiddenTitle={t("card.hidden")}
      footer={
        <Link href={href} className="text-primary hover:underline">
          {t("card.open")}
        </Link>
      }
      {...model}
    />
  );
}
