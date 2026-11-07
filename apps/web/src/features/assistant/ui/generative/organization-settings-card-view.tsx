"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCan } from "@/components/shell/permissions-context";
import { DomainJoinSwitch } from "@/features/organization-profile/ui/domain-join-form";
import { TimeZoneEditor } from "@/features/organization-profile/ui/time-zone-form";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { SettingRow, SettingsCard } from "./settings-card";

export type OrganizationSettingsCardViewProps = GenerativeProps<"organization-settings-card">;

/** The General page's settings in the chat: the time zone and domain join, editable in place. */
export function OrganizationSettingsCardView({ profile }: OrganizationSettingsCardViewProps) {
  const nav = useTranslations("nav");
  const t = useTranslations("organizationSettings");
  const [current, setCurrent] = useState(profile);
  const canConfigure = useCan({ permission: "configuration:write" });
  const canManageMembers = useCan({ permission: "member:write" });
  const { emailDomain } = current;
  return (
    <SettingsCard
      slot="organization-settings-card"
      title={nav("general")}
      href={ROUTES.adminGeneral}
    >
      <SettingRow section="timeZone" description={t("timeZoneHint")}>
        <TimeZoneEditor
          timeZone={current.timeZone}
          canEdit={canConfigure}
          onSaved={({ value }) => setCurrent(value)}
        />
      </SettingRow>
      <SettingRow
        section="domainJoin"
        description={
          emailDomain ? t("domainJoin.hint", { domain: emailDomain }) : t("domainJoin.noDomain")
        }
        action={
          <DomainJoinSwitch
            emailDomain={emailDomain}
            enabled={current.domainJoin}
            canEdit={canManageMembers}
            onSaved={({ value }) => setCurrent(value)}
          />
        }
      />
    </SettingsCard>
  );
}
