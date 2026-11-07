"use client";

import type { SettingKey } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { adminSectionLink } from "@/components/shell/admin-items";
import { Link } from "@/lib/navigation";

export type SettingRowProps = {
  /** The setting, named like its administration section. */
  setting: SettingKey;
  description?: string | undefined;
  /** A control on the title row, like a switch. */
  action?: ReactNode;
  children?: ReactNode;
};

/**
 * One setting in the settings card: its title (the section's), an inline control or its editor,
 * and a link to the section in the administration area. The editor is the section's own.
 */
export function SettingRow({ setting, description, action, children }: SettingRowProps) {
  const t = useTranslations("adminArea.search.entries");
  const ui = useTranslations("assistant.ui.settings");
  const href = adminSectionLink({ id: setting });
  return (
    <section
      data-slot="setting-row"
      data-setting={setting}
      aria-label={t(`${setting}.label`)}
      className="grid gap-3 border-t p-4 text-sm first:border-t-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h3 className="font-medium text-base">{t(`${setting}.label`)}</h3>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
      {href ? (
        <Link href={href} className="w-fit text-primary hover:underline">
          {ui("open")}
        </Link>
      ) : null}
    </section>
  );
}
