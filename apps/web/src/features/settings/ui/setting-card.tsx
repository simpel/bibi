"use client";

import type { SettingKey } from "@bibi/core/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { adminSectionLink } from "@/components/shell/admin-items";
import { Link } from "@/lib/navigation";

export type SettingCardFrameProps = {
  /** The setting, named like its administration section. */
  setting: SettingKey;
  description?: string | undefined;
  /** A control on the title row, like a switch. */
  action?: ReactNode;
  children?: ReactNode;
};

/**
 * One setting in the chat: its title (the section's), an inline control or its editor, and a link
 * to the section in the administration area. The editor is the section's own.
 */
export function SettingCard({ setting, description, action, children }: SettingCardFrameProps) {
  const t = useTranslations("adminArea.search.entries");
  const ui = useTranslations("assistant.ui.settings");
  const href = adminSectionLink({ id: setting });
  return (
    <Card data-slot="setting-card" data-setting={setting} className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4 p-4 pb-2">
        <div className="grid gap-1">
          <CardTitle className="text-base">{t(`${setting}.label`)}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="grid gap-4 p-4 pt-2 text-sm">
        {children}
        {href ? (
          <Link href={href} className="w-fit text-primary hover:underline">
            {ui("open")}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
