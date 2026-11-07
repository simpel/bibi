"use client";

import { useTranslations } from "next-intl";
import { useCan } from "@/components/shell/permissions-context";
import { DomainJoinSwitch } from "@/features/organization-profile/ui/domain-join-form";
import { TimeZoneEditor } from "@/features/organization-profile/ui/time-zone-form";
import { SettingCard } from "./setting-card";
import type { SettingCardProps } from "./setting-props";

/** The organization's time zone (ADR 0064), with the General page's own editor. */
export function TimeZoneSettingCard({ view, onSaved }: SettingCardProps) {
  const t = useTranslations("organizationSettings");
  const canEdit = useCan({ permission: "configuration:write" });
  if (!view.organization) return null;
  return (
    <SettingCard setting="timeZone" description={t("timeZoneHint")}>
      <TimeZoneEditor
        timeZone={view.organization.timeZone}
        canEdit={canEdit}
        onSaved={({ value: { timeZone, emailDomain, domainJoin } }) =>
          onSaved({ patch: { organization: { timeZone, emailDomain, domainJoin } } })
        }
      />
    </SettingCard>
  );
}

/** Domain join (ADR 0078): a switch on the title row, like on the General page. */
export function DomainJoinSettingCard({ view, onSaved }: SettingCardProps) {
  const t = useTranslations("organizationSettings.domainJoin");
  const canEdit = useCan({ permission: "member:write" });
  if (!view.organization) return null;
  const { emailDomain, domainJoin } = view.organization;
  return (
    <SettingCard
      setting="domainJoin"
      description={emailDomain ? t("hint", { domain: emailDomain }) : t("noDomain")}
      action={
        <DomainJoinSwitch
          emailDomain={emailDomain}
          enabled={domainJoin}
          canEdit={canEdit}
          onSaved={({ value }) =>
            onSaved({
              patch: {
                organization: {
                  timeZone: value.timeZone,
                  emailDomain: value.emailDomain,
                  domainJoin: value.domainJoin,
                },
              },
            })
          }
        />
      }
    />
  );
}
